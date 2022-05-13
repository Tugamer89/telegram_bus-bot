//	IMPORTING

const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path');
const json2csv = require('json2csv').parse;
const lineReader = require('line-reader');
const axios = require("axios")
const token = process.env.TOKEN
const bot = new TelegramBot(token, { polling: true })


//	INIZIALIZATION

let users = []
let clock = []
let admins = []
let start = []
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = ["January" ,"February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

loadDB()


//	FUNCTIONS

function fileName(userId) {
	return `data-${userId}.csv`
}

function loadDB() {
  users = []
	clock = []
	admins = []
	start = []
  lineReader.eachLine('registered_users.data', function(line) {
		line = line.split('-')
    users.push(Number(line[0]))
		clock.push(line[1])
  })
	lineReader.eachLine('admins.data', function(line) {
    admins.push(Number(line))
  })
	lineReader.eachLine('users.data', function(line) {
    start.push(Number(line))
  })
  console.log('Database loaded!')
}

function saveDB() {
  fs.writeFile('registered_users.data', '', function(err) { //to reset the file
    if (err) console.log(err)
  })
	fs.writeFile('admins.data', '', function(err) { //to reset the file
    if (err) console.log(err)
  })
	fs.writeFile('users.data', '', function(err) { //to reset the file
    if (err) console.log(err)
  })

	for (let i = 0; i < users.length; i++) {	//to actually write the file
		fs.appendFile('registered_users.data', `${users[i]}-${clock[i]}\n`, function(err) {
			if (err) console.log(err)
		})
	}

	for (let i = 0; i < admins.length; i++) {	//to actually write the file
		fs.appendFile('admins.data', `${admins[i]}\n`, function(err) {
			if (err) console.log(err)
		})
	}

	for (let i = 0; i < start.length; i++) {	//to actually write the file
		fs.appendFile('users.data', `${start[i]}\n`, function(err) {
			if (err) console.log(err)
		})
	}

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


function remove(file_name, del) {
	let data = fs.readFileSync(file_name, 'utf-8').split(/\r\n|\r|\n/)


	if (del > data.length - 2 || data.length < 3) {
		return `${data.length}`
	}

	let real = []

	for (let i = 0; i < data.length - 1; i++) {
		if (del == i || (del == -1 && i == data.length - 2)) {
			continue
		}
		real.push(data[i])
	}

  fs.writeFileSync(file_name, real.join('\n')+'\n')
	return `-1`
}


//	BOT COMMANDS
bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id
	bot.sendMessage(chatId, `Hi ${msg.from.username}, this bot allows you to save the bus number and code with date and time in a CSV database and to be able to download it! \n/help for help`)

	if (!start.includes(chatId)) {
		start.push(chatId)
		saveDB()
	}
})

bot.onText(/\/help/, (msg) => {
	const chatId = msg.chat.id
	bot.sendMessage(chatId, `This is the help command!

-> /start          start the bot

-> /help          this message

-> /register [hh:mm]          register to the newsletter - default 23:00 CET

-> /unregister          unregister to the newsletter

-> /add [weekday] [day] [month] [year] [hh:mm] [code] [number]          manually add a bus - weekday in letters, day in numbers, year in numbers, code 4 digits, number 1-999

-> [code] [number]          automatically add a bus - code 4 digits, number 1-999

-> /remove [line]          remove a line from the database - default the last one

-> Send me the CSV          send the database in the CSV format`)

	if (admins.includes(chatId)) {
		bot.sendMessage(chatId, `

-> /admin_add [user_id]          add an admin with user id

-> /admin_remove [user_id]          remove an admin from user id

-> /admin_list          list all admins

-> /user_list          list all users

-> /send [user_ids] {[message]}          send the message to the selected users
`)
	}
})


bot.onText(/\/register/, (msg, match) => {
  const chatId = msg.chat.id

  if (users.includes(chatId)) {
    bot.sendMessage(chatId, 'You cannot register twice or more!')
  } else {
		let time = match['input'].split(' ')[1]

		if (typeof time === 'undefined') {
			time = `23:00`
		}

		if (!/^(2[0-3]|[0-1]?[0-9]):([0-5]?[0-9])$/.test(time)) {
			bot.sendMessage(chatId, `The time ${time} is not valid`)
		}
		else {
			let times = time.split(':')
			let hours = times[0]
			let minutes = times[1]

			if (/^[0-9]$/.test(hours)) {
				hours = `0${hours}`
			}
			if (/^[0-9]$/.test(minutes)) {
				minutes = `0${minutes}`
			}

			time = `${hours}:${minutes}`

			users.push(chatId)
			clock.push(time)
			console.log(`User ${chatId} registered with ${time}`)
			bot.sendMessage(chatId, `You have been registred for the ${time} newsletter!`)
			saveDB()
		}
  }
})


bot.onText(/\/unregister/, (msg) => {
  const chatId = msg.chat.id
  if (users.includes(chatId)) {
    for (var i = 0; i < users.length; i++) {
      if (users[i] === chatId) {
        users.splice(i, 1)
				clock.splice(i, 1)
        break
      }
    }
    console.log(`User ${chatId} unregistered`)
    bot.sendMessage(chatId, 'You have been unregistred!')
		saveDB()
  } else {
    bot.sendMessage(chatId, 'You cannot unregister if you are not registered yet!')
  }
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
  let hours = date_ob.getHours()+2	//+2 for CET
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
  let hours = date_ob.getHours()+2	//+2 for CET
  let minutes = date_ob.getMinutes()

	for (let j = 0; j < clock.length; j++) {
		let time = clock[j].split(':')
		let prv_hours = time[0]
		let prv_minutes = time[1]

		if (hours == prv_hours && minutes == prv_minutes) {
			bot.sendMessage(users[j], "That's your CSV:")
			bot.sendDocument(users[j], `./CSV/${fileName(users[j])}`)
			console.log(`Newsletter sent to ${users[j]}`)
		}
	}

}, 1000 * 60)  //Check every minute


bot.on('message', (msg) => {
  const chatId = msg.chat.id
  if (msg.text == 'Send me the CSV') {
    bot.sendMessage(chatId, "That's your CSV:")
    bot.sendDocument(chatId, `./CSV/${fileName(chatId)}`)
    console.log(`File CSV sent to ${chatId}`)
  }
})


bot.onText(/\/remove/, (msg, match) => {
	const chatId = msg.chat.id

	let line = match['input'].split(' ')[1]

	pablo = true
	if (typeof line === 'undefined') {
		line = -1
		pablo = false
	}
	try {
		if (isNaN(line) || (line < 1 && pablo)) {
			bot.sendMessage(chatId, `The line ${line} is not valid`)
		}

		else {
			good = remove(`./CSV/${fileName(chatId)}`, line)

			if (line == -1) {
				line = 'Last line'
			}
			else {
				line = `Line ${line}`
			}

			if (good == '-1') {
				console.log(`${chatId} deleted ${line}`)
				bot.sendMessage(chatId, `${line} deleted successfully!`)
			}
			else if (good < 3){
				bot.sendMessage(chatId, `Your database is empty`)
			}
			else {
				bot.sendMessage(chatId, `${line} is not between 1 and ${good-2}`)
			}
		}

	} catch (err) {
		bot.sendMessage(chatId, `Your database is empty`)
	}
})



//	ADMIN COMMANDS	

bot.onText(/\/admin_add/, (msg, match) => {
	const chatId = msg.chat.id
	
	let id = match['input'].split(' ')[1]

	if (admins.includes(chatId)) {
		if (! /^[0-9]{10}$/.test(id)) {
			bot.sendMessage(chatId, `The id must be 10 digits long!`)
		}
		else if (admins.includes(id)) {
			bot.sendMessage(chatId, `The user ${id} is already an admin`)
		}
		else {
			admins.push(id)
			bot.sendMessage(chatId, `The user ${id} just became an admin`)
			console.log(`${chatId} added ${id} as admin`)
			saveDB()
		}
	}
})


bot.onText(/\/admin_remove/, (msg, match) => {
	const chatId = msg.chat.id
	
	let id = match['input'].split(' ')[1]

	if (admins.includes(chatId)) {
		if (! /^[0-9]{10}$/.test(id)) {
			bot.sendMessage(chatId, `The id must be 10 digits long!`)
		}
		else if (admins.includes(Number(id))) {
			for (var i = 0; i < admins.length; i++) {
	      if (admins[i] == id) {
	        admins.splice(i, 1)
	        break
	      }
	    }
			
			bot.sendMessage(chatId, `The user ${id} has just been removed by admins`)
			console.log(`${chatId} removed ${id} from admin`)
			saveDB()
		}
		else {
			bot.sendMessage(chatId, `The user ${id} is not an admin`)
		}
	}
})


bot.onText(/\/admin_list/, (msg) => {
	const chatId = msg.chat.id
	
	if (admins.includes(chatId)) {
		bot.sendMessage(chatId, `List of admins: ${admins.join(', ')}`)
	}
})


bot.onText(/\/user_list/, (msg) => {
	const chatId = msg.chat.id
	
	if (admins.includes(chatId)) {
		bot.sendMessage(chatId, `List of users: ${start.join(', ')}`)
	}
})


bot.onText(/\/send/, (msg, match) => {
	const chatId = msg.chat.id

	if (admins.includes(chatId)) {
		let who = match['input'].split(' ')[1].split('-')
		let message = match['input'].split('{')[1].split('}')[0]

		if (who[0] == 'all') {
			for (let i = 0; i < start.length; i++) {
				who[i] = start[i]
			}
		}
		
		for (let i = 0; i < who.length; i++) {
			if (/^[0-9]{10}$/.test(who[i])) {
				bot.sendMessage(who[i], `An admin just sent you a message: ${message}`)
				bot.sendMessage(chatId, `Just sent the message to ${who[i]}`)
			}
			else {
				bot.sendMessage(chatId, `Message not sent to ${who[i]}`)
			}
		}

		console.log(`The admin ${chatId} sent the message {${message}} to ${who}`)
	}
})




//	AUTO-UPDATE
/*
setInterval(function() {
	let this_data = fs.readFileSync(path.basename(__filename), 'utf-8')
	
	axios
		.get('https://raw.githubusercontent.com/Tugamer89/telegram_bus-bot/main/index.js')
    .then(res => {
      let new_data = res.data

      if (this_data != new_data) {
    		console.log('Updated!')
    		fs.writeFileSync(path.basename(__filename), new_data)
    	}
    })
    .catch(error => {console.log(error)});

}, 1000 * 60 * 60)  //Check every 1 hour
*/
