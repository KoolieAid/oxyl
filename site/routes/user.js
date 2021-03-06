const express = require("express"),
	main = require("../website.js");
const router = express.Router(); // eslint-disable-line new-cap
const sqlQueries = Oxyl.modScripts.sqlQueries;

async function getDesc(user) {
	let query = `SELECT VALUE FROM Description WHERE USER = "${user}"`;
	let data = await sqlQueries.dbQuery(query);

	if(data && data[0]) return data[0].VALUE;
	else return "None set";
}

async function resetDesc(userid) {
	return await sqlQueries.dbQuery(`DELETE FROM Description WHERE USER = "${userid}"`);
}

async function setDesc(userid, value) {
	if(value === "None set") return false;

	let desc = await getDesc(userid);
	if(desc === "None set") return await sqlQueries.dbQuery(`INSERT INTO Description(USER, VALUE) VALUES ("${userid}",${sqlQueries.sqlEscape(value)})`);
	else return await sqlQueries.dbQuery(`UPDATE Description SET VALUE=${sqlQueries.sqlEscape(value)} WHERE USER = "${userid}"`);
}

router.get("/update", async (req, res) => {
	res.redirect("http://minemidnight.work/user/");
	res.end();
});

router.post("/update", async (req, res) => {
	if(main.tokens[req.sessionID]) {
		let loggedUser = await main.getInfo(req.sessionID, "users/@me");

		if(req.body.reset) await resetDesc(loggedUser.id);
		else if(req.body.desc) await setDesc(loggedUser.id, req.body.desc);
		res.redirect(`http://minemidnight.work/user/${loggedUser.id}`);
		res.end();
	} else {
		res.redirect(`http://minemidnight.work/user`);
		res.end();
	}
});

router.get("*", async (req, res) => {
	let data = {};
	let path = req.path;
	if(path.endsWith("/")) path = path.substring(0, path.length - 1);
	let user = path.substring(1);

	if(bot.users.has(user)) {
		user = bot.users.get(user);
		user.shared = bot.guilds.filter(guild => guild.members.has(user.id)).length;
		user.description = await getDesc(user.id);
		data.viewUser = user;

		if(main.tokens[req.sessionID]) {
			let loggedUser = await main.getInfo(req.sessionID, "users/@me");
			if(loggedUser.id === user.id) data.desc = true;
		}
	}

	res.send(await main.parseHB("user", req, data));
	res.end();
});

module.exports = router;
