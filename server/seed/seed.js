require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const College = require('../models/College');
const Department = require('../models/Department');
const Player = require('../models/Player');
const Sport = require('../models/Sport');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');
const Score = require('../models/Score');
const Fixture = require('../models/Fixture');
const Venue = require('../models/Venue');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const { recalculateGlobalDepartmentLeaderboard } = require('../utils/leaderboardHelper');

const seedData = async () => {
  try {
    // 1. Clear database
    console.log('🧹 Clearing existing database collections...');
    await mongoose.connection.dropDatabase();
    console.log('✅ Database cleared.');

    // 2. Create College
    console.log('🏫 Seeding College data...');
    const college = await College.create({
      name: "NEC College of Engineering",
      address: "Salem, Tamil Nadu",
      phone: "04427650001",
      email: "info@nec.edu",
      logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?q=80&w=200&auto=format&fit=crop",
      website: "https://nec.edu",
      establishedYear: 2001,
      createdBy: new mongoose.Types.ObjectId() // temporary placeholder, updated after user creation
    });

    // 3. Create Users
    console.log('👥 Seeding User profiles (Admins, Coordinators, Scorer)...');
    
    // SuperAdmin
    const superAdmin = await User.create({
      name: "Admin NEC",
      email: "admin@nec.edu",
      password: "Admin@123",
      role: "superAdmin",
      college: college._id,
      phone: "9876543210"
    });

    // Update College createdBy
    college.createdBy = superAdmin._id;
    await college.save();

    // 5 Coordinators for the 5 departments
    const departmentsList = [
      { name: "Computer Science & Engineering", code: "CSE" },
      { name: "Electronics & Communication Engineering", code: "ECE" },
      { name: "Mechanical Engineering", code: "Mech" },
      { name: "Civil Engineering", code: "Civil" },
      { name: "Master of Business Administration", code: "MBA" }
    ];

    const coordinators = [];
    const depts = [];

    for (const d of departmentsList) {
      // Create Department
      const dept = await Department.create({
        name: d.name,
        college: college._id,
        coordinatorName: `Prof. ${d.code} Coordinator`,
        coachName: `Coach ${d.code}`,
        description: `Department of ${d.name} sports wing.`,
        logo: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150&auto=format&fit=crop`
      });
      depts.push(dept);

      // Create Coordinator User
      const coordEmail = `${d.code.toLowerCase()}@nec.edu`;
      const coord = await User.create({
        name: `${d.code} Coord`,
        email: coordEmail,
        password: "Coord@123",
        role: "coordinator",
        college: college._id,
        department: dept._id,
        phone: "9887766554"
      });
      coordinators.push(coord);
    }

    // Scorer User
    const scorer = await User.create({
      name: "NEC Scorer",
      email: "scorer@nec.edu",
      password: "Scorer@123",
      role: "scorer",
      college: college._id,
      phone: "9123456789"
    });

    // 4. Create Sports
    console.log('⚽ Seeding Sports list...');
    const football = await Sport.create({
      name: "Football",
      icon: "soccer-ball",
      description: "Inter-department 11v11 standard matches.",
      maxPlayersPerTeam: 15,
      eventTypes: ["Goal", "Yellow Card", "Red Card", "Assist", "Foul"]
    });

    const cricket = await Sport.create({
      name: "Cricket",
      icon: "cricket-bat",
      description: "T20 format inter-department cricket tournament.",
      maxPlayersPerTeam: 16,
      eventTypes: ["Run", "Wicket", "Boundary (4)", "Sixer (6)", "No Ball", "Wide"]
    });

    const basketball = await Sport.create({
      name: "Basketball",
      icon: "basketball-ball",
      description: "Standard 5v5 court basketball tournament.",
      maxPlayersPerTeam: 10,
      eventTypes: ["Basket (2)", "Three-Pointer (3)", "Free Throw (1)", "Foul"]
    });

    // 5. Create Venues
    console.log('🏟️ Seeding Venues...');
    const mainGround = await Venue.create({
      name: "Main Athletic Ground",
      location: "East Campus Block A",
      capacity: 5000,
      amenities: ["Grass turf", "Flooding lights", "Restrooms"],
      college: college._id
    });

    const indoorStadium = await Venue.create({
      name: "Netaji Indoor Stadium",
      location: "Central Campus Sports Hall",
      capacity: 1500,
      amenities: ["Hardwood court", "Scoreboard displays", "Airconditioned"],
      college: college._id
    });

    const cricketGround = await Venue.create({
      name: "NEC Cricket Field",
      location: "West Campus Sports Complex",
      capacity: 3000,
      amenities: ["Clay pitch", "Pavilion stand", "Nets area"],
      college: college._id
    });

    // 6. Create Settings
    console.log('⚙️ Seeding default college settings...');
    await Settings.create({
      college: college._id,
      collegeName: college.name,
      logo: college.logo,
      primaryColor: "#0f172a",
      darkMode: false,
      allowPublicRegistration: true,
      updatedBy: superAdmin._id
    });

    // 7. Create Players (8 per department = 40 total)
    console.log('🏃 Seeding 40 Player Profiles and generating QR Codes...');
    const playerRollNames = {
      CSE: ["Karthik", "Suresh", "Manoj", "Hari", "Prabhu", "Vijay", "Anand", "Raja"],
      ECE: ["Aravind", "Ramesh", "Deepak", "Venkatesh", "Ganesh", "Balaji", "Naveen", "Kumar"],
      Mech: ["Arun", "Sanjay", "Dinesh", "Siva", "Prakash", "Vignesh", "Satheesh", "Rajesh"],
      Civil: ["Ram", "Krishna", "Selvan", "Murugan", "Muthu", "Saravanan", "Kannan", "Gopal"],
      MBA: ["Vimal", "Ajith", "Surya", "Vikram", "Dhanush", "Sidharth", "Madhavan", "Vishnu"]
    };

    const playersMapByDept = {};

    for (const dept of depts) {
      const code = departmentsList.find(d => d.name === dept.name).code;
      const names = playerRollNames[code];
      playersMapByDept[code] = [];

      for (let i = 0; i < 8; i++) {
        const rollNum = `${code}230${i + 1}`;
        const nameStr = `${names[i]} Kumar`;
        
        const player = new Player({
          name: nameStr,
          rollNumber: rollNum,
          department: dept._id,
          college: college._id,
          photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop`,
          age: 20 + (i % 3),
          phone: `9444${i}12345`,
          email: `${names[i].toLowerCase()}@student.nec.edu`,
          position: i === 0 ? "Captain / Goalkeeper" : i < 4 ? "Defender" : "Forward",
          jerseyNumber: i + 1,
          sports: [football._id, cricket._id],
          isActive: true
        });

        await player.save();

        playersMapByDept[code].push(player);
      }

      // Assign Captain to Department record
      dept.captain = playersMapByDept[code][0]._id;
      await dept.save();
    }

    // 8. Create Tournaments
    console.log('🏆 Seeding Tournaments...');
    const tFootball = await Tournament.create({
      name: "Inter-Dept Football Championship 2025",
      sport: football._id,
      college: college._id,
      startDate: new Date('2025-01-10T10:00:00Z'),
      endDate: new Date('2025-01-20T17:00:00Z'),
      venue: mainGround._id,
      format: "knockout",
      rules: "FIFA standard rules apply. Direct knockouts. Red cards trigger a 1-match suspension.",
      status: "completed",
      banner: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
      createdBy: superAdmin._id
    });

    const tCricket = await Tournament.create({
      name: "NEC Cricket Premier League 2025",
      sport: cricket._id,
      college: college._id,
      startDate: new Date(), // ongoing today
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // finishes in 10 days
      venue: cricketGround._id,
      format: "league",
      rules: "T20 Format. 4 overs max per bowler. Super over applies for draws in league table.",
      status: "ongoing",
      banner: "https://images.unsplash.com/photo-1531415080290-b9b682e5c69b?q=80&w=600&auto=format&fit=crop",
      createdBy: superAdmin._id
    });

    // 9. Register Teams (Approved for both tournaments)
    console.log('🛡️ Seeding Teams rosters...');
    
    // Football Tournament (4 departments registered: CSE, ECE, Mech, Civil)
    const teamsFootball = [];
    const fbDepts = ["CSE", "ECE", "Mech", "Civil"];
    for (const code of fbDepts) {
      const nameToSearch = departmentsList.find(item => item.code === code)?.name;
      const dept = depts.find(d => d.name === nameToSearch);
      const plList = playersMapByDept[code];

      const team = await Team.create({
        tournament: tFootball._id,
        department: dept._id,
        players: plList.map(p => p._id),
        captain: plList[0]._id,
        viceCaptain: plList[1]._id,
        coach: `Coach ${code} FB`,
        photo: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=300&auto=format&fit=crop",
        isApproved: true,
        approvedBy: superAdmin._id
      });
      teamsFootball.push(team);
    }

    // Cricket Tournament (all 5 departments registered)
    const teamsCricket = [];
    const crDepts = ["CSE", "ECE", "Mech", "Civil", "MBA"];
    for (const code of crDepts) {
      const nameToSearch = departmentsList.find(item => item.code === code)?.name;
      const dept = depts.find(d => d.name === nameToSearch);
      const plList = playersMapByDept[code];

      const team = await Team.create({
        tournament: tCricket._id,
        department: dept._id,
        players: plList.map(p => p._id),
        captain: plList[0]._id,
        viceCaptain: plList[1]._id,
        coach: `Coach ${code} Cricket`,
        photo: "https://images.unsplash.com/photo-1531415080290-b9b682e5c69b?q=80&w=300&auto=format&fit=crop",
        isApproved: true,
        approvedBy: superAdmin._id
      });
      teamsCricket.push(team);
    }

    // 10. Fixtures & Matches for Completed Football Tournament (Knockout Bracket)
    console.log('📅 Seeding fixtures & matches for Completed Football Tournament...');
    
    // We pair:
    // SF1: CSE vs ECE -> CSE wins 3-1
    // SF2: Mech vs Civil -> Mech wins 2-0
    // Final: CSE vs Mech -> CSE wins 2-1 (CSE champion)
    
    const teamCSE_fb = teamsFootball.find(t => t.coach.includes('CSE'));
    const teamECE_fb = teamsFootball.find(t => t.coach.includes('ECE'));
    const teamMech_fb = teamsFootball.find(t => t.coach.includes('Mech'));
    const teamCivil_fb = teamsFootball.find(t => t.coach.includes('Civil'));

    // SF1 Match
    const sf1Match = await Match.create({
      tournament: tFootball._id,
      sport: football._id,
      round: "1", // Semifinal
      team1: teamCSE_fb._id,
      team2: teamECE_fb._id,
      venue: mainGround._id,
      scheduledAt: new Date('2025-01-12T10:00:00Z'),
      status: "completed",
      scorer: scorer._id,
      referee: "Mr. Rajendran",
      score1: 3,
      score2: 1,
      winner: teamCSE_fb._id
    });
    
    // SF1 Fixture
    const sf1Fixture = await Fixture.create({
      tournament: tFootball._id,
      round: 1,
      matchNumber: 1,
      match: sf1Match._id,
      team1: teamCSE_fb._id,
      team2: teamECE_fb._id,
      scheduledAt: sf1Match.scheduledAt
    });

    await Score.create({
      match: sf1Match._id, tournament: tFootball._id,
      team1: teamCSE_fb._id, team2: teamECE_fb._id,
      score1: 3, score2: 1
    });

    // SF2 Match
    const sf2Match = await Match.create({
      tournament: tFootball._id,
      sport: football._id,
      round: "1",
      team1: teamMech_fb._id,
      team2: teamCivil_fb._id,
      venue: mainGround._id,
      scheduledAt: new Date('2025-01-12T14:30:00Z'),
      status: "completed",
      scorer: scorer._id,
      referee: "Mr. Murugesan",
      score1: 2,
      score2: 0,
      winner: teamMech_fb._id
    });

    const sf2Fixture = await Fixture.create({
      tournament: tFootball._id,
      round: 1,
      matchNumber: 2,
      match: sf2Match._id,
      team1: teamMech_fb._id,
      team2: teamCivil_fb._id,
      scheduledAt: sf2Match.scheduledAt
    });

    await Score.create({
      match: sf2Match._id, tournament: tFootball._id,
      team1: teamMech_fb._id, team2: teamCivil_fb._id,
      score1: 2, score2: 0
    });

    // Final Match
    const finalMatch = await Match.create({
      tournament: tFootball._id,
      sport: football._id,
      round: "2", // Final Round
      team1: teamCSE_fb._id,
      team2: teamMech_fb._id,
      venue: mainGround._id,
      scheduledAt: new Date('2025-01-15T15:00:00Z'),
      status: "completed",
      scorer: scorer._id,
      referee: "Mr. Rajendran",
      score1: 2,
      score2: 1,
      winner: teamCSE_fb._id
    });

    const finalFixture = await Fixture.create({
      tournament: tFootball._id,
      round: 2,
      matchNumber: 1,
      match: finalMatch._id,
      team1: teamCSE_fb._id,
      team2: teamMech_fb._id,
      scheduledAt: finalMatch.scheduledAt
    });

    await Score.create({
      match: finalMatch._id, tournament: tFootball._id,
      team1: teamCSE_fb._id, team2: teamMech_fb._id,
      score1: 2, score2: 1
    });

    // 11. Seeding Fixtures and Matches for Cricket Tournament (League, Ongoing)
    console.log('🏏 Seeding league schedules for Cricket Tournament...');
    // We register 5 teams. Let's pre-generate matches using standard league scheduler.
    // For 5 teams, Berger rotation scheduler generates 4 rounds of matches (5 matches per round if including byes, 10 matches total)
    const crTeamCSE = teamsCricket.find(t => t.coach.includes('CSE'));
    const crTeamECE = teamsCricket.find(t => t.coach.includes('ECE'));
    const crTeamMech = teamsCricket.find(t => t.coach.includes('Mech'));
    const crTeamCivil = teamsCricket.find(t => t.coach.includes('Civil'));
    const crTeamMBA = teamsCricket.find(t => t.coach.includes('MBA'));

    // To make it structured, we manually schedule 6 matches:
    // Match 1: CSE vs ECE -> Completed, CSE wins (142 runs vs 120 runs)
    // Match 2: Mech vs Civil -> Completed, Mech wins (156 runs vs 110 runs)
    // Match 3: MBA vs CSE -> Completed, CSE wins (98 runs vs 102 runs)
    // Match 4: ECE vs Mech -> Completed, ECE wins (130 runs vs 128 runs)
    // Match 5: Civil vs MBA -> Completed, MBA wins (121 runs vs 125 runs)
    // Match 6: Mech vs Civil -> Currently Live! (Cricket Ground, Mech batting at 80/2 vs Civil)

    const matchesCricketData = [
      { t1: crTeamCSE, t2: crTeamECE, s1: 142, s2: 120, win: crTeamCSE, status: "completed", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { t1: crTeamMech, t2: crTeamCivil, s1: 156, s2: 110, win: crTeamMech, status: "completed", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { t1: crTeamMBA, t2: crTeamCSE, s1: 98, s2: 102, win: crTeamCSE, status: "completed", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { t1: crTeamECE, t2: crTeamMech, s1: 130, s2: 128, win: crTeamECE, status: "completed", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { t1: crTeamCivil, t2: crTeamMBA, s1: 121, s2: 125, win: crTeamMBA, status: "completed", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { t1: crTeamMech, t2: crTeamCivil, s1: 82, s2: 0, win: null, status: "live", date: new Date() }
    ];

    let matchCounter = 1;
    for (const item of matchesCricketData) {
      const match = await Match.create({
        tournament: tCricket._id,
        sport: cricket._id,
        round: "1",
        team1: item.t1._id,
        team2: item.t2._id,
        venue: cricketGround._id,
        scheduledAt: item.date,
        status: item.status,
        scorer: scorer._id,
        referee: "Mr. Shanmugam",
        score1: item.s1,
        score2: item.s2,
        winner: item.win ? item.win._id : null
      });

      await Fixture.create({
        tournament: tCricket._id,
        round: 1,
        matchNumber: matchCounter,
        match: match._id,
        team1: item.t1._id,
        team2: item.t2._id,
        scheduledAt: item.date
      });

      await Score.create({
        match: match._id,
        tournament: tCricket._id,
        team1: item.t1._id,
        team2: item.t2._id,
        score1: item.s1,
        score2: item.s2
      });

      matchCounter++;
    }

    // 12. Create Notifications (10 mock messages for administrative feed)
    console.log('🔔 Seeding Notifications feed...');
    const mockNotifications = [
      { type: "teamApproved", title: "CSE Cricket Team Approved", message: "Roster registration request approved by Administrator.", user: superAdmin._id, relatedTournament: tCricket._id },
      { type: "teamApproved", title: "Mech Cricket Team Approved", message: "Roster registration request approved by Administrator.", user: superAdmin._id, relatedTournament: tCricket._id },
      { type: "teamApproved", title: "Civil Cricket Team Approved", message: "Roster registration request approved by Administrator.", user: superAdmin._id, relatedTournament: tCricket._id },
      { type: "teamApproved", title: "ECE Cricket Team Approved", message: "Roster registration request approved by Administrator.", user: superAdmin._id, relatedTournament: tCricket._id },
      { type: "teamApproved", title: "MBA Cricket Team Approved", message: "Roster registration request approved by Administrator.", user: superAdmin._id, relatedTournament: tCricket._id },
      { type: "matchScheduled", title: "Cricket Round 1 Match Scheduled", message: "CSE vs ECE scheduled at Cricket Ground.", user: superAdmin._id, relatedTournament: tCricket._id },
      { type: "matchScheduled", title: "Cricket Round 1 Match Scheduled", message: "Mech vs Civil scheduled at Cricket Ground.", user: superAdmin._id, relatedTournament: tCricket._id },
      { type: "matchLive", title: "Mech vs Civil is LIVE", message: "Match ongoing at NEC Cricket Ground. Tune in for live scores!", user: null, relatedTournament: tCricket._id },
      { type: "matchFinished", title: "Football Finals Completed", message: "CSE wins the Inter-Dept Football Championship 2025!", user: null, relatedTournament: tFootball._id },
      { type: "winnerAnnounced", title: "Tournament Concluded", message: "CSE department lift the trophy for the Inter-Dept Football Championship 2025.", user: null, relatedTournament: tFootball._id }
    ];

    await Notification.insertMany(mockNotifications);

    // Recalculate global department leaderboard standings
    await recalculateGlobalDepartmentLeaderboard();

    console.log('----------------------------------------------------');
    console.log('✅ Seeded successfully!');
    console.log('🔑 Logins Available:');
    console.log('   - SuperAdmin  : admin@nec.edu / Admin@123');
    console.log('   - Coordinator : cse@nec.edu / Coord@123');
    console.log('   - Scorer      : scorer@nec.edu / Scorer@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error: ', error.message);
    process.exit(1);
  }
};

// Execute Seeder
connectDB().then(() => {
  seedData();
});
