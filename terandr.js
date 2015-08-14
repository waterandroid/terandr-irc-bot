var IRC = require("internet-relay-chat");
var fs = require("fs");
var settings;
try {
	settings = require("./settings_dev");
	console.log("Using Developer Settings");
} catch (e) {
	try {
		settings = require("./settings");
	} catch (f) {
		throw new Error("settings.js does not exist or cannot be read");
	}
}
var plugins;
var functions = {};
var onRegister = [];
var onMessage = [];
var pluginCommands = {};

fs.readdir("./Plugins/", function(err, files) {
	for (i = 0; i < files.length; i++) {
		plugins = require("./Plugins/"+ files[i] + "/main");
		for (var func in plugins.functions) {
			functions[func] = plugins.functions[func];
		}
		onRegister.push(plugins.onRegister);
		for (j = 0; j < plugins.onMessage.length; j++) {
			onMessage.push(plugins.onMessage[j]);
		}
		for (var comm in plugins.commands) {
			pluginCommands[comm] = plugins.commands[comm];
		}
	}
	if (startupFunctions()) {
		console.log("Loaded plugins running");
		bot.connect();
	}
});

var bot = new IRC(settings.botDetails);
var mainChannel = settings.mainChannel;
var admin = settings.admin;
var specialChar = settings.specialChar;

var commands = {
	help: function() {
		console.log(pluginCommands);
		console.log(commands);
	},
	repeat: function(message, sender) {
		if (sender == admin) {
			console.log("Sending message to " + mainChannel + ": " + message);
			bot.message(mainChannel, message);
			return true;
		}
		return false;
	}
};

var adminCommands = {

};

exports.bot = bot;

bot.on("connect", function() {
  console.log("Bot connected");
});

bot.on("registered", function() {
	if (mainChannel) {
		bot.join(mainChannel);
	}
	for (i = 0; i < onRegister.length; i++) {
		onRegister[i]();
	}
	bot.message("NickServ", "IDENTIFY " + settings.idPassword);
	console.log("Bot registered");
});

bot.on("join", function(user, channel) {
	if (user.nick == this.options.nick) console.log("Bot joined " + channel);
});

bot.on("message", function(sender, channel, message) {
	messageFunctions(sender, channel, message);

	if (message.charAt(0) == specialChar) {
		var messageSplit = message.indexOf(" ");
		var command = message.substr(1, messageSplit - 1);
		var parameters = message.substr(messageSplit + 1);
		if (messageSplit < 0) command = message.substr(1);

		if (commands[command]) {
			commands[command](parameters, sender.nick);
		}
	}
});

function startupFunctions() {
	for (var c in pluginCommands) {
		commands[c] = pluginCommands[c];
	}
	return true;
}

function messageFunctions(sender, channel, message) {
	for (i = 0; i < onMessage.length; i++) {
		if (functions[onMessage[i]](sender, channel, message) === true) {
			break;
		}
	}
	return true;
}
