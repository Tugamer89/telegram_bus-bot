const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path');
const json2csv = require('json2csv').parse;
const lineReader = require('line-reader');
const token = process.env['token']
const bot = new TelegramBot(token, { polling: true })

let users = []
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = ["January" ,"February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

loadDB()


function fileName(userId) {
	return `data-${userId}.csv`
}

function loadDB() {
  users = []
  lineReader.eachLine('registered_users.data', function(line) {
    users.push(Number(line))
  })
  console.log('Database loaded!')
}

function saveDB() {
  fs.writeFile('registered_users.data', '', function(err) { //to reset the file
    if (err) console.log(err)
  })

  users.forEach(function(user) { //to write actually the file
    fs.appendFile('registered_users.data', `${user}\n`, function(err) {
      if (err) console.log(err)
    })
  })
  console.log('Database saved!')
}


function write_(file_Name, data) {
	const filename = path.join(__dirname, 'CSV', `${file_Name}`)
	let rows
	if (!fs.existsSync(filename)) {
		rows = json2csv(data, { header: true })
	} else {
		rows = json2csv(data, { header: false })
	}
	
	fs.appendFileSync(filename, rows)
	fs.appendFileSync(filename, "\r\n")
}



bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id
	bot.sendMessage(chatId, `Hi ${msg.from.username}, this bot allows you to save the bus number and code with date and time in a CSV database and to be able to download it \n/help for help`)
})

bot.onText(/\/help/, (msg) => {
	const chatId = msg.chat.id
	bot.sendMessage(chatId, `This is the help command!


/help          this message

/register [hh:mm]          register to the newsletter - default 23:00 CET

/unregister          unregister to the newsletter

/add [weekday] [day] [month] [year] [hh:mm] [code] [number]          manually add a bus - weekday in letters, day in numbers, year in numbers, code 4 digits, number 1-999

[code] [number]          automatically add a bus - code 4 digits, number 1-999

Send me the CSV          send the database in the CSV format`)
})


bot.onText(/\/register/, (msg) => {
  const chatId = msg.chat.id
	
  if (users.includes(chatId)) {
    bot.sendMessage(chatId, 'You cannot register twice or more!')
  } else {
		users.push(chatId)
		console.log(`User ${chatId} registered`)
		bot.sendMessage(chatId, 'You have been registred!')
  }
  saveDB()
})


bot.onText(/\/unregister/, (msg) => {
  const chatId = msg.chat.id
  if (users.includes(chatId)) {
    for (var i = 0; i < users.length; i++) {
      if (users[i] === chatId) {
        users.splice(i, 1)
        break
      }
    }
    console.log(`User ${chatId} unregistered`)
    bot.sendMessage(chatId, 'You have been unregistred!')
  } else {
    bot.sendMessage(chatId, 'You cannot unregister if you are not registered yet!')
  }
  saveDB()
})


bot.onText(/\/add/, (msg, match) => {
	const chatId = msg.chat.id
	
	let ts = Date.now()
  let date_ob = new Date(ts)
	
	date = match['input'].split(' ')
	
	let weekday = date[1]
	let day = date[2]
	let month = date[3]
	let year = date[4]
	let time = date[5]
	let code = date[6]
	let number = date[7]
	
	
	//checks of data in order: weekday - month - year - day - time (minutes & hours) - code - number

	if (date.length < 8) {	//check if all fields are tehre
		bot.sendMessage(chatId, `You must specify all the fields (/help for help)`)
	}
	else if (!weekdays.includes(weekday)) {	//check if the weekday is valid
		bot.sendMessage(chatId, `${weekday} is not in ${weekdays}`)
	}
	else if (!months.includes(month)) {	//check if the month is valid
		bot.sendMessage(chatId, `${month} is not in ${months}`)
	}
	else if (year > date_ob.getFullYear() || year < date_ob.getFullYear()-2) {	//check if the year is valid (must be between this year - 2 and this year)
		bot.sendMessage(chatId, `The year ${year} is not between ${date_ob.getFullYear()-2} and ${date_ob.getFullYear()}`)
	}
	else if ((new Date(`${year}-${months.indexOf(month)+1}-${day}`) === "Invalid Date") || isNaN(new Date(`${year}-${months.indexOf(month)+1}-${day}`))) {	//check if the day is valid
		bot.sendMessage(chatId, `The month ${month} does not have ${day} days`)
	}
	else if (!/^(2[0-3]|[0-1]?[0-9]):([0-5]?[0-9])$/.test(time)) {
		bot.sendMessage(chatId, `The time ${time} is not valid`)
	}
	else if (!/^\d{4}$/.test(code)) {	//check if the 'bus' code is valid
		bot.sendMessage(chatId, `The code of the bus ${code} is not 4 digits long`)
	}
	else if (!/^[1-9][0-9]{0,2}$/.test(number)) {	//check if the 'bus' number is valid
		bot.sendMessage(chatId, `The number of the bus ${number} is not between 1 and 999`)
	}
	
	else {		//everything is ok so I can go!
		let times = time.split(':')
		let hours = times[0]
		let minutes = times[1]

		if (/^[0-9]$/.test(day)) {
			day = `0${day}`
		}
		if (/^[0-9]$/.test(hours)) {
			hours = `0${hours}`
		}
		if (/^[0-9]$/.test(minutes)) {
			minutes = `0${minutes}`
		}

		time = `${hours}:${minutes}`
		
		let data = [{
	    'Weekday': String(weekday),
	    'Day': String(day),
	    'Month': String(month),
	    'Year': String(year),
	    'Time': String(time),
	    'Code': String(code),
	    'Number': String(number)
	  }]
		
	  write_(fileName(chatId), data)
		bot.sendMessage(chatId, `Manually added ${match} at ${weekday} ${day} ${month} ${year} ${time}`)
		console.log(`Manually added ${match} at ${weekday} ${day} ${month} ${year} ${time}`)
	}
})


bot.onText(/^[0-9]{4}\ [1-9][0-9]{0,2}$/, (msg, match) => {		//4 numbers and a space and a number between 1 and 999 and then end here
  const chatId = msg.chat.id
	
  let ts = Date.now()
  let date_ob = new Date(ts)
  let minutes = date_ob.getMinutes()
  let hours = date_ob.getHours()+2	//+2 fro CET
  let weekday = weekdays[date_ob.getDay()]
  let day = date_ob.getDate()
  let month = months[date_ob.getMonth()]
  let year = date_ob.getFullYear()

  let datas = String(match).split(" ")

  if (/^[0-9]$/.test(day)) {
		day = `0${day}`
	}
	if (/^[0-9]$/.test(hours)) {
		hours = `0${hours}`
	}
	if (/^[0-9]$/.test(minutes)) {
		minutes = `0${minutes}`
	}

  let data = [{
    'Weekday': String(weekday),
    'Day': String(day),
    'Month': String(month),
    'Year': String(year),
    'Time': String(hours+":"+minutes),
    'Code': String(datas[0]),
    'Number': String(datas[1])
  }]

  write_(fileName(chatId), data)
	bot.sendMessage(chatId, `Added ${match} at ${weekday} ${day} ${month} ${year} ${hours}:${minutes}`)
	console.log(`Added ${match} at ${weekday} ${day} ${month} ${year} ${hours}:${minutes}`)
})


setInterval(function () {
  let ts = Date.now()
  let date_ob = new Date(ts)
  let hours = date_ob.getHours()
  let minutes = date_ob.getMinutes()

  if (hours == '21' && minutes == '00') {	//UTC hour
    if (users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        bot.sendMessage(users[i], "That's the CSV:")
        bot.sendDocument(users[i], `./CSV/${fileName(users[i])}`)
        console.log(`File CSV sent to ${String(users[i])}`)
      }
    } else {
      console.log('No users registered')
    }
  }
}, 1000 * 60 * 1)  //Check every one minute


bot.on('message', (msg) => {
  const chatId = msg.chat.id
  if (msg.text == 'Send me the CSV') {
    bot.sendMessage(chatId, "That's the CSV:")
    bot.sendDocument(users[i], `./CSV/${fileName(chatId)}`)
    console.log(`File CSV sent to ${String(chatId)}`)
  }
})
