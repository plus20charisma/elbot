//Requires
var Discord = require("discord.js");
const google = require("google");
const request = require("request");
const jsonfile = require("jsonfile");
const fs = require('fs');

//settings & data
var settings = require("./settings/settings.json"),
    prefixes = settings.prefixes,
    triviaset = settings.trivia;
var bank = require("./settings/bank.json");

//invoke bot
var bot = new Discord.Client({autoReconnect:true});

///////////////////////////////////// C0MMAND HANDLER /////////////////////////////////////////////

const cmdHandlr = (bot, msg, cmdTxt, suffix) => {
    switch (cmdTxt) {

        // searches
        case "goog" :
        case "google" : commands.goog(bot, msg, suffix); break;
        case "weather" : commands.weather(bot, msg, suffix); break;
        
        //trivia
        case "trivia" : trivia.start(bot, msg, suffix); break;

        //admin controls
        case "eval" : commands.eval(bot, msg, cmdTxt, suffix); break;
        case "logout" : commands.logout(bot, msg); break;
        default: return;
    }
};

//////////////////////////////////////// COMMANDS ///////////////////////////////////////////////

var commands = {
    goog : (bot, msg, suffix) => {
        var search = "google";
        if(suffix){search = suffix;}
        google(search, function(err, response){
            if(err || !response || !response.links || response.links.length < 1){bot.sendMessage(msg, "**Your search resulted in an error. Please forgive me **"+msg.author.username, function(error, sentMessage){bot.deleteMessage(sentMessage, {"wait": 5000})});}
            else {
                if(response.links[0].link === null){
                    for(var i = 1; i < response.links.length; i++){
                        if (response.links[i].link !== null) {
                            bot.sendMessage(msg, "I searched for **\""+search+"\"** and found this, **"+msg.author.username+"\n"+response.links[i].link);
                            return;
                        }
                    }
                }
                else {
                    bot.sendMessage(msg, "**I searched for **\""+search+"\"** and found this, **"+msg.author.username+"\n"+response.links[0].link);
                }
            }
        })
    },

    weather : (bot, msg, suffix) => {
        if (!suffix) suffix = "Los Angeles, CA";
        if (suffix === "shit") suffix = "San Diego"; //kekeke
        suffix = suffix.replace(" ", "");
        var rURL = (/\d/.test(suffix) == false) ? "http://api.openweathermap.org/data/2.5/weather?q=" + suffix + "&APPID=" + settings.weather_api_key : "http://api.openweathermap.org/data/2.5/weather?zip=" + suffix + "&APPID=" + settings.weather_api_key;
        request(rURL, function (error, response, weath) {
            if (!error && response.statusCode == 200) {
                weath = JSON.parse(weath);
                if (!weath.hasOwnProperty("weather")) {
                    return;
                }
                var weatherC = ":sunny:";
                if ((weath.weather[0].description.indexOf("rain") > -1) || (weath.weather[0].description.indexOf("drizzle") > -1)) {
                    weatherC = ":cloud_rain:";
                }
                else if (weath.weather[0].description.indexOf("snow") > -1) {
                    weatherC = ":snowflake:";
                }
                else if (weath.weather[0].description.indexOf("clouds") > -1) {
                    weatherC = ":cloud:";
                }
                else if (weath.weather[0].description.indexOf("storm") > -1) {
                    weatherC = ":cloud_lightning:";
                }
                var direction = Math.floor((weath.wind.deg / 22.5) + 0.5)
                var compass = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
                var msgArray = [];
                var sunrise = new Date(weath.sys.sunrise * 1000)
                var formattedSunrise = (sunrise.getHours()) + ':' + ("0" + sunrise.getMinutes()).substr(-2)
                var sunset = new Date(weath.sys.sunset * 1000)
                var formattedSunset = (sunset.getHours()) + ':' + ("0" + sunset.getMinutes()).substr(-2)
                msgArray.push(":earth_americas: __**Weather for " + weath.name + ", " + weath.sys.country + ":**__ • (*" + weath.coord.lon + ", " + weath.coord.lat + "*)")
                msgArray.push("**" + weatherC + "Current Weather Conditions:** " + weath.weather[0].description)
                msgArray.push("**:sweat: Humidity:** " + weath.main.humidity + "% - **:cityscape:  Current Temperature:** " + Math.round(weath.main.temp - 273.15) + "°C / " + Math.round(((weath.main.temp - 273.15) * 1.8) + 32) + "°F")
                msgArray.push("**:cloud: Cloudiness:** " + weath.clouds.all + "% - **:wind_blowing_face:  Wind Speed:** " + weath.wind.speed + " m/s [*" + compass[(direction % 16)] + "*]")
                msgArray.push("**:sunrise_over_mountains:  Sunrise:** " + formattedSunrise + " UTC / **:city_dusk: Sunset:** " + formattedSunset + " UTC")
                bot.sendMessage(msg, msgArray);
            }
            else {
                console.log(error);
                bot.sendMessage(msg, "There was an error getting the weather, please try again later.", function (error, sentMessage) {
                    bot.deleteMessage(sentMessage, {"wait": 5000})
                });
            }
        });
    },
//admtn
    eval: (bot, msg, cmdTxt, suffix) => {
        if (msg.author.id === settings.owner) {
            try {
                var thing = eval(suffix.toString());
                bot.sendMessage(msg, `\`\`\`javascript\n${thing}\`\`\``);
            } catch(e) {
                console.log(e);
                bot.sendMessage(msg, `\`\`\`Error: ${e}\`\`\``);
            }
        } else {
            return;
        }
    },

    logout: (bot, msg) => {
        if (msg.author.id === settings.owner) {
            bot.sendMessage(msg, "Logging Out").then(bot.logout());
        } else {
            return;
        }
    }
};


////////////////////////////////////TO DO FUNCTIONS//////////////////////////////////////////////

//TODO general help command

//economy / slots
var economy = {

    register : function (msg) {
        // TODO
    }

};


//trivia commands
var trivia = {
    help : (bot, msg) => bot.sendMessage(msg, 'Trivia Help Invoked'), //help cmd TODO

    categories: fs.readdirSync(triviaset.path),

    list : (bot, msg) => {
        catTxt = trivia.categories.map(function(x) {return x.slice(0, -5)}).join(' ');
        bot.sendMessage(msg, `Trivia categories available are:\n\`\`\`${catTxt}\`\`\``);
    },

    start : (bot ,msg, suffix) => {
        if (suffix === 'list') {trivia.list(bot, msg, suffix)};
        if (suffix === 'help') {trivia.help(bot, msg)};
    }
}

//trivia session
var triviaSesh = {
    scorelist : {},
    current : {},
    count : 0,
    loadlist : function (bot, msg, suffix) {
        if (!suffix) {trivia.help};
    }
}

////////////////////////////////////DONE FUNCTIONS//////////////////////////////////////////////

//msg checker
bot.on("message", (msg) => {
    if(msg.author === bot.user || msg.channel.isPrivate) return;
    else if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
        var cmdTxt = msg.content.split(' ')[0].substr(1);
        var sufArr = msg.content.split(' '); sufArr.splice(0, 1);
        var suffix = sufArr.join(' ');
        cmdHandlr(bot, msg, cmdTxt, suffix);
    }
    else return;
});

//ready
bot.on("ready", ()=>{
    bot.setPlayingGame("Three Laws of Robotics");
    console.log("ELbot is ready");
});

bot.on("disconnected", ()=> {process.exit(0);});
//login
bot.loginWithToken(settings.token);console.log("Logged in using Token");