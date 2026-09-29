const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Match = require('../models/Match');
const Score = require('../models/Score');
const Notification = require('../models/Notification');
const { recalculateGlobalDepartmentLeaderboard } = require('../utils/leaderboardHelper');

let ioInstance = null;

/**
 * Initialize Socket.IO server
 * @param {Object} server HTTP Server instance
 */
const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true
    }
  });

  ioInstance = io;

  // Authentication Middleware for socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || 'nec_sports_access_token_secret_string_123456'
        );
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          socket.user = user;
        } else {
          socket.user = null;
        }
      } catch (err) {
        socket.user = null;
      }
    } else {
      socket.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (Authenticated: ${!!socket.user})`);

    // Client subscribes/joins a match room
    socket.on('match:subscribe', (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`👥 Client ${socket.id} joined room match:${matchId}`);
    });

    // Client unsubscribes/leaves a match room
    socket.on('match:unsubscribe', (matchId) => {
      socket.leave(`match:${matchId}`);
      console.log(`👥 Client ${socket.id} left room match:${matchId}`);
    });

    // Event: Set Match Score (Scorer only)
    socket.on('score:set', async ({ matchId, score1, score2 }) => {
      if (!socket.user || !['scorer', 'superAdmin'].includes(socket.user.role)) {
        return socket.emit('error', 'Unauthorized action');
      }

      try {
        const parsedScore1 = parseInt(score1, 10) || 0;
        const parsedScore2 = parseInt(score2, 10) || 0;

        // Update Match
        const match = await Match.findByIdAndUpdate(
          matchId,
          { score1: parsedScore1, score2: parsedScore2 },
          { new: true }
        ).populate('team1 team2');

        if (!match) return socket.emit('error', 'Match not found');

        // Update Score document
        await Score.findOneAndUpdate(
          { match: matchId },
          { score1: parsedScore1, score2: parsedScore2 },
          { upsert: true, new: true }
        );

        // Emit update to room
        io.to(`match:${matchId}`).emit('score:update', {
          matchId,
          score1: parsedScore1,
          score2: parsedScore2,
          updatedAt: new Date()
        });

        // Trigger leaderboard recalculation
        await recalculateGlobalDepartmentLeaderboard();
      } catch (err) {
        console.error('Socket score:set error:', err.message);
        socket.emit('error', 'Failed to update score');
      }
    });



    // Event: Pause Match (Scorer only)
    socket.on('match:pause', async ({ matchId }) => {
      if (!socket.user || !['scorer', 'superAdmin'].includes(socket.user.role)) {
        return socket.emit('error', 'Unauthorized action');
      }

      try {
        const match = await Match.findByIdAndUpdate(
          matchId,
          { status: 'paused' },
          { new: true }
        );

        if (!match) return socket.emit('error', 'Match not found');

        io.to(`match:${matchId}`).emit('match:status', {
          matchId,
          status: 'paused'
        });
      } catch (err) {
        socket.emit('error', 'Failed to pause match');
      }
    });

    // Event: Resume Match (Scorer only)
    socket.on('match:resume', async ({ matchId }) => {
      if (!socket.user || !['scorer', 'superAdmin'].includes(socket.user.role)) {
        return socket.emit('error', 'Unauthorized action');
      }

      try {
        const match = await Match.findByIdAndUpdate(
          matchId,
          { status: 'live' },
          { new: true }
        );

        if (!match) return socket.emit('error', 'Match not found');

        io.to(`match:${matchId}`).emit('match:status', {
          matchId,
          status: 'live'
        });
      } catch (err) {
        socket.emit('error', 'Failed to resume match');
      }
    });

    // Event: Finish Match (Scorer only)
    socket.on('match:finish', async ({ matchId, winnerId }) => {
      if (!socket.user || !['scorer', 'superAdmin'].includes(socket.user.role)) {
        return socket.emit('error', 'Unauthorized action');
      }

      try {
        const match = await Match.findById(matchId).populate('tournament team1 team2');
        if (!match) return socket.emit('error', 'Match not found');

        // Calculate winner
        let resolvedWinner = null;
        if (winnerId && winnerId !== 'draw') {
          resolvedWinner = winnerId;
        } else if (winnerId === 'draw') {
          resolvedWinner = null;
        } else {
          // Auto resolve based on final scores
          if (match.score1 > match.score2) resolvedWinner = match.team1._id;
          else if (match.score2 > match.score1) resolvedWinner = match.team2._id;
        }

        match.status = 'completed';
        match.winner = resolvedWinner;
        await match.save();

        // Emit match completed status
        io.to(`match:${matchId}`).emit('match:status', {
          matchId,
          status: 'completed',
          winner: resolvedWinner
        });

        // Generate notification
        const team1Name = match.team1.coach ? `Team 1` : 'Team 1'; // Safe checks
        const pMatch = await Match.findById(matchId).populate({
          path: 'team1 team2',
          populate: { path: 'department' }
        });
        
        const t1Name = pMatch.team1?.department?.name || 'Team 1';
        const t2Name = pMatch.team2?.department?.name || 'Team 2';

        const notifTitle = `Match Finished: ${t1Name} vs ${t2Name}`;
        const notifMessage = `The match concluded with a score of ${match.score1} - ${match.score2}.`;

        const newNotification = await Notification.create({
          type: 'matchFinished',
          title: notifTitle,
          message: notifMessage,
          relatedMatch: matchId,
          relatedTournament: match.tournament._id
        });

        // Broadcast notification:push to everyone connected
        io.emit('notification:push', {
          type: 'matchFinished',
          title: notifTitle,
          message: notifMessage,
          relatedMatch: matchId,
          relatedTournament: match.tournament._id
        });

        // Trigger leaderboard points recalculation
        await recalculateGlobalDepartmentLeaderboard();
      } catch (err) {
        console.error('Socket match:finish error:', err.message);
        socket.emit('error', 'Failed to complete match');
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Helper to emit events from REST controllers
 * @param {string} matchId Match Room Identifier
 * @param {string} event Event Name
 * @param {Object} data Payload
 */
const emitToMatch = (matchId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`match:${matchId}`).emit(event, data);
  }
};

/**
 * Helper to broadcast global events
 * @param {string} event Event Name
 * @param {Object} data Payload
 */
const broadcastGlobal = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

module.exports = {
  initSocket,
  emitToMatch,
  broadcastGlobal,
  getIo: () => ioInstance
};
