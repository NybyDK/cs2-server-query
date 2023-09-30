import Query from "./Query.js";

const server = new Query("wzretakes1.noob.club", 26252);

(async () => {
    const infoResponse = await server.requestInfo();
    const playerResponse = await server.requestPlayers();
    console.log(infoResponse);
    console.log(playerResponse);
})();
