const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//convert player table object to response object
const convertPlayersTableToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//API -1 Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
      SELECT
        *
      FROM
        player_details;`;
  const getAllPlayers = await db.all(getPlayersQuery);
  response.send(
    getAllPlayers.map((eachPlayer) =>
      convertPlayersTableToResponseObject(eachPlayer)
    )
  );
});

//API - 2 Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
      SELECT
        *
      FROM
        player_details
      WHERE
        player_id = ${playerId}`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(convertPlayersTableToResponseObject(getPlayer));
});

//API - 3 Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
      UPDATE
       player_details
      SET
       player_name = '${playerName}'
      WHERE
       player_id = ${playerId};`;
  const updatePlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//2//convert match table to response object
const convertMatchDbToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API - 4 Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
      SELECT
        *
      FROM
        match_details
      WHERE
        match_id = ${matchId}`;
  const getMatch = await db.get(getMatchQuery);
  response.send(convertMatchDbToResponseObject(getMatch));
});

//API - 5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getplayerMatchesQuery = `
      SELECT
        *
      FROM
        match_details NATURAL JOIN player_match_score
      WHERE
        player_id = ${playerId};`;
  const playerMatches = await db.all(getplayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) => convertMatchDbToResponseObject(eachMatch))
  );
});

//API - 6 Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getplayersOfMatchesQuery = `
      SELECT
        *
      FROM
       player_match_score NATURAL JOIN player_details
      WHERE
        match_id = ${matchId};`;
  const getplayersOfMatch = await db.all(getplayersOfMatchesQuery);
  response.send(
    getplayersOfMatch.map((eachPlayer) =>
      convertPlayersTableToResponseObject(eachPlayer)
    )
  );
});

//3//convert match table to response object
const convertPlayerScoreDbToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API - 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatOfPlayerQuery = `
      SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
      FROM
        player_match_score NATURAL JOIN player_details 
      WHERE
        player_id = ${playerId};`;
  const getplayersOfMatch = await db.get(getStatOfPlayerQuery);
  response.send(getplayersOfMatch);
});
