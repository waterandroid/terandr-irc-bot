var IRC = require("internet-relay-chat");
var fs = require("fs");
var settings = require("./settings");
if (fs.existsSync("settings_dev.js")) {
	settings = require("./settings_dev");
}
var plugins = require("./Plugins/spam-moderation/main");

var bot = new IRC(settings.botDetails);
var mainChannel = settings.mainChannel;
var admin = settings.admin;
var specialChar = settings.specialChar;
var functions = plugins.functions;
var onStart = plugins.onStart;
var onMessage = plugins.onMessage;

var commands = {
	help: function () {
		console.log(onStart);
	}
};

var adminCommands = {

};

exports.bot = bot;

bot.connect();

bot.on("connect", function() {
  console.log("Bot connected");
});

bot.on("registered", function() {
	if (mainChannel) {
		  bot.join(mainChannel);
	}
	console.log("Bot registered");
	if (startupFunctions()) {
		console.log("Loaded plugins running");
	}
});

bot.on("join", function(user, channel) {
	if (user.nick == this.options.nick) console.log("Bot joined " + channel);
});

bot.on("message", function(sender, channel, message) {
	var commandAccess;
	var adminCommand = false;
  if (sender.hostmask == admin) {
		console.log("Sent From Admin");
		adminCommand = true;
		adminNick = sender.nick;
	}
	messageFunctions(sender, channel, message);

	if (message.charAt(0) == specialChar) {
		var messageSplit = message.indexOf(" ");
		var command = message.substr(1, messageSplit - 1);
		var parameters = message.substr(messageSplit + 1);
		if (messageSplit < 0) command = message.substr(1);

		if (commands[command] !== undefined) {
			commands[command](parameters, sender.nick, channel);
		} else if ((adminCommands[command] !== undefined) && (adminCommand === true)) {
			adminCommands[command](parameters, sender.nick, channel);
		} else {
			console.log("Unknown command from " + sender.nick + ": " + message);
		}
	}
});

function startupFunctions() {
	for (i = 0; i < onStart.length; i++) {
		functions[onStart[i]]();
	}
	return true;
}

function messageFunctions(sender, channel, message) {
	for (i = 0; i < onMessage.length; i++) {
		functions[onMessage[i]](sender, channel, message);
	}
	return true;
}
