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

let users = []		//list of registered users
let clock = []		//list of the registered users newsletter's time
let admins = []		//list of admins
let start = []		//list of all users of the bot
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = ["January" ,"February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

loadDB()


//	FUNCTIONS

function fileName(userId) {		//just retrieve the full name of the file
	return `data-${userId}.csv`
}

function loadDB() {	//load the database

	//reset of lists
  users = []
	clock = []
	admins = []
	start = []

	//save registered users and their newsletter's time reading line by line the file
  lineReader.eachLine('registered_users.data', function(line) {
		line = line.split('-')
    users.push(Number(line[0]))
		clock.push(line[1])
  })

	//save admins reading line by line the file
	lineReader.eachLine('admins.data', function(line) {
    admins.push(Number(line))
  })

	//save all users
	lineReader.eachLine('users.data', function(line) {
    start.push(Number(line))
  })

	
  console.log('Database loaded!')
}

function saveDB() {		//save database
	//resetting the files
  fs.writeFile('registered_users.data', '', function(err) {
    if (err) console.log(err)
  })
	fs.writeFile('admins.data', '', function(err) {
    if (err) console.log(err)
  })
	fs.writeFile('users.data', '', function(err) {
    if (err) console.log(err)
  })

	
	//to actually write the file of registered users
	for (let i = 0; i < users.length; i++) {	
		fs.appendFile('registered_users.data', `${users[i]}-${clock[i]}\n`, function(err) {
			if (err) console.log(err)
		})
	}
	
	//to actually write the file of admins
	for (let i = 0; i < admins.length; i++) {	
		fs.appendFile('admins.data', `${admins[i]}\n`, function(err) {
			if (err) console.log(err)
		})
	}

	//to actually write the file of all users
	for (let i = 0; i < start.length; i++) {	
		fs.appendFile('users.data', `${start[i]}\n`, function(err) {
			if (err) console.log(err)
		})
	}

  console.log('Database saved!')
}


function write_(file_Name, data) {		//write the CSV
	const filename = path.join(__dirname, 'CSV', `${file_Name}`)	//filename
	let rows		

	//check if to put header or not 
	if (!fs.existsSync(filename)) {
		rows = json2csv(data, { header: true })
	} else {
		rows = json2csv(data, { header: false })
	}

	//write the file
	fs.appendFileSync(filename, rows)
	fs.appendFileSync(filename, "\r\n")
}


function remove(file_name, del) {		//remove the line
	let data = fs.readFileSync(file_name, 'utf-8').split(/\r\n|\r|\n/)	//old data

	//checks if data is right
	if (del > data.length - 2 || data.length < 3) {
		return `${data.length}`
	}

	let real = []		//new data

	//delte the selcted line
	for (let i = 0; i < data.length - 1; i++) {
		if (del == i || (del == -1 && i == data.length - 2)) {
			continue
		}
		real.push(data[i])
	}

	//write the file
  fs.writeFileSync(file_name, real.join('\n')+'\n')
	return `-1`
}


//	BOT COMMANDS
bot.onText(/\/start/, (msg) => {		//	/start
	const chatId = msg.chat.id		//chat id of the user
	bot.sendMessage(chatId, `Hi ${msg.from.username}, this bot allows you to save the bus number and code with date and time in a CSV database and to be able to download it! \n/help for help`)

	if (!start.includes(chatId)) {
		start.push(chatId)
		saveDB()
	}
})

bot.onText(/\/help/, (msg) => {		//	/help
	const chatId = msg.chat.id		//chat id of the user
	bot.sendMessage(chatId, `This is the help command!

-> /start          start the bot

-> /help          this message

-> /register [hh:mm]          register to the newsletter - default 23:00 CET

-> /unregister          unregister to the newsletter

-> /add [weekday] [day] [month] [year] [hh:mm] [code] [number]          manually add a bus - weekday in letters, day in numbers, year in numbers, code 4 digits, number 1-999

-> [code] [number]          automatically add a bus - code 4 digits, number 1-999

-> /remove [line]          remove a line from the database - default the last one

-> Send me the CSV          send the database in the CSV format`)

	//if the user is an admin
	if (admins.includes(chatId)) {
		bot.sendMessage(chatId, `

-> /admin_add [user_id]          add an admin with user id

-> /admin_remove [user_id]          remove an admin from user id

-> /admin_list          list all admins

-> /user_list          list all users

-> /send [user_ids] [message]          send the message to the selected users
`)
	}
})


bot.onText(/\/register/, (msg, match) => {		//	/register
  const chatId = msg.chat.id		//chat id of the user

	//checks if the user is already registered
  if (users.includes(chatId)) {
    bot.sendMessage(chatId, 'You cannot register twice or more!')
		return
  }

	
	let time = match['input'].split(' ')[1]		//time fo the newsletter

	//checks if the time is defined
	if (typeof time === 'undefined') {
		time = `23:00`
	}

	//checks if the time is valid
	if (!/^(2[0-3]|[0-1]?[0-9]):([0-5]?[0-9])$/.test(time)) {
		bot.sendMessage(chatId, `The time ${time} is not valid`)
		return 
	}
	
	let times = time.split(':')		//list of hours and minutes	[4, 20]
	let hours = times[0]					//hours
	let minutes = times[1]				//minutes

	//checks if the hours are in the corerct format (hh)
	if (/^[0-9]$/.test(hours)) {
		hours = `0${hours}`
	}
	//checks if the minutes are in the corerct format (mm)
	if (/^[0-9]$/.test(minutes)) {
		minutes = `0${minutes}`
	}

	time = `${hours}:${minutes}`

	//register the user
	users.push(chatId)
	clock.push(time)

	//feedback
	console.log(`User ${chatId} registered with ${time}`)
	bot.sendMessage(chatId, `You have been registred for the ${time} newsletter!`)
	saveDB()
})


bot.onText(/\/unregister/, (msg) => {		//	/unregister
  const chatId = msg.chat.id			//chat id of the user

	//checks if the user is registered
  if (! users.includes(chatId)) {
		bot.sendMessage(chatId, 'You cannot unregister if you are not registered yet!')
		return
	}

	//unregister the user
	for (var i = 0; i < users.length; i++) {
		if (users[i] === chatId) {
			users.splice(i, 1)
			clock.splice(i, 1)
			break
		}
	}

	//feedback
	console.log(`User ${chatId} unregistered`)
	bot.sendMessage(chatId, 'You have been unregistred!')
	saveDB()
})


bot.onText(/\/add/, (msg, match) => {		//	/add
	const chatId = msg.chat.id		//chat id of the user

	let ts = Date.now()					//date of now
  let date_ob = new Date(ts)	//date of now

	date = match['input'].split(' ')	//inoput datas

	let weekday = date[1]	//day of the week
	let day = date[2]			//day of the month
	let month = date[3]		//month	
	let year = date[4]		//year
	let time = date[5]		//time
	let code = date[6]		//code of the bus
	let number = date[7]	//number of the bus


	//checks of data in order: weekday - month - year - day - time (minutes & hours) - code - number
	
	//check if all fields are there
	if (date.length < 8) {	
		bot.sendMessage(chatId, `You must specify all the fields (/help for help)`)
		return
	}
	
	//check if the weekday is valid
	if (!weekdays.includes(weekday)) {	
		bot.sendMessage(chatId, `${weekday} is not in ${weekdays}`)
		return
	}
	
	//check if the month is valid
	if (!months.includes(month)) {	
		bot.sendMessage(chatId, `${month} is not in ${months}`)
		return
	}
	
	//check if the year is valid (must be between this year - 2 and this year)
	if (year > date_ob.getFullYear() || year < date_ob.getFullYear()-2) {	
		bot.sendMessage(chatId, `The year ${year} is not between ${date_ob.getFullYear()-2} and ${date_ob.getFullYear()}`)
		return
	}

	//check if the day is valid
	if ((new Date(`${year}-${months.indexOf(month)+1}-${day}`) === "Invalid Date") || isNaN(new Date(`${year}-${months.indexOf(month)+1}-${day}`))) {	
		bot.sendMessage(chatId, `The month ${month} does not have ${day} days`)
		return
	}

	//check if the time is valid
	if (!/^(2[0-3]|[0-1]?[0-9]):([0-5]?[0-9])$/.test(time)) {
		bot.sendMessage(chatId, `The time ${time} is not valid`)
		return
	}

	//check if the 'bus' code is valid
	if (!/^\d{4}$/.test(code)) {	
		bot.sendMessage(chatId, `The code of the bus ${code} is not 4 digits long`)
		return
	}
	
	//check if the 'bus' number is valid
	if (!/^[1-9][0-9]{0,2}$/.test(number)) {	
		bot.sendMessage(chatId, `The number of the bus ${number} is not between 1 and 999`)
		return
	}

	//everything is ok so I can go!
	
	let times = time.split(':')		//list of hours and minutes	[4, 20]
	let hours = times[0]					//hours
	let minutes = times[1]				//minutes

	//checks if the day is in the corerct format (dd)
	if (/^[0-9]$/.test(day)) {
		day = `0${day}`
	}
	//checks if the hours are in the corerct format (hh)
	if (/^[0-9]$/.test(hours)) {
		hours = `0${hours}`
	}
	//checks if the minutes are in the corerct format (mm)
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

	//write
	write_(fileName(chatId), data)

	//feedback
	bot.sendMessage(chatId, `Manually added ${match} at ${weekday} ${day} ${month} ${year} ${time}`)
	console.log(`Manually added ${match} at ${weekday} ${day} ${month} ${year} ${time}`)
})


bot.onText(/^[0-9]{4}\ [1-9][0-9]{0,2}$/, (msg, match) => {		//4 numbers and a space and a number between 1 and 999 and then end here = add auto bus
  const chatId = msg.chat.id		//chat id of the user

  let ts = Date.now()												//date of now
  let date_ob = new Date(ts)								//date of now
  let minutes = date_ob.getMinutes()				//minutes of now
  let hours = date_ob.getHours()+2					//hours of now +2 for CET->tofix
  let weekday = weekdays[date_ob.getDay()]	//day of the week of now
  let day = date_ob.getDate()								//day of the month
  let month = months[date_ob.getMonth()]		//month of now
  let year = date_ob.getFullYear()					//yoar of now

  let datas = String(match).split(" ")	//datas

	//checks if the day is in the corerct format (dd)
  if (/^[0-9]$/.test(day)) {
		day = `0${day}`
	}

	//checks if the hours are in the corerct format (hh)
	if (/^[0-9]$/.test(hours)) {
		hours = `0${hours}`
	}

	//checks if the minutes are in the corerct format (mm)
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


	//write
  write_(fileName(chatId), data)

	//feedback
	bot.sendMessage(chatId, `Added ${match} at ${weekday} ${day} ${month} ${year} ${hours}:${minutes}`)
	console.log(`Added ${match} at ${weekday} ${day} ${month} ${year} ${hours}:${minutes}`)
})


setInterval(function () {		//newsletter
  let ts = Date.now()									//date of now
  let date_ob = new Date(ts)					//date of now
  let hours = date_ob.getHours()+2		//hours of now - +2 for CET -> tofix
  let minutes = date_ob.getMinutes()	//minutes of now

	for (let j = 0; j < clock.length; j++) {
		let time = clock[j].split(':')
		let prv_hours = time[0]
		let prv_minutes = time[1]

		//checks if it's the corerct time
		if (hours == prv_hours && minutes == prv_minutes) {
			bot.sendMessage(users[j], "That's your CSV:")
			bot.sendDocument(users[j], `./CSV/${fileName(users[j])}`)
			console.log(`Newsletter sent to ${users[j]}`)
		}
	}

}, 1000 * 60)  //Check every 60 seconds


bot.on('message', (msg) => {
  const chatId = msg.chat.id		//user chat id

	//checks if the message is the one for sending the file		
  if (msg.text == 'Send me the CSV') {
		//feedback
    bot.sendMessage(chatId, "That's your CSV:")
    bot.sendDocument(chatId, `./CSV/${fileName(chatId)}`)
    console.log(`File CSV sent to ${chatId}`)
  }
})


bot.onText(/\/remove/, (msg, match) => {		//	/remove
	const chatId = msg.chat.id		//chat_id of the sender

	let line = match['input'].split(' ')[1]		//datas

	pablo = true	//is last line?

	//checks if line is defined
	if (typeof line === 'undefined') {
		line = -1	// = last line
		pablo = false
	}
	
	try {
		//checks if the line is valid
		if (isNaN(line) || (line < 1 && pablo)) {
			bot.sendMessage(chatId, `The line ${line} is not valid`)
			return
		}

		//removing the line
		good = remove(`./CSV/${fileName(chatId)}`, line)	//result of deleting the line

		//set up the message
		if (line == -1) {
			line = 'Last line'
		}
		else {
			line = `Line ${line}`
		}

		//feedback
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

	} catch (err) {
		bot.sendMessage(chatId, `Your database is empty`)
	}
})



//	ADMIN COMMANDS	

bot.onText(/\/admin_add/, (msg, match) => {		// /admin_add
	const chatId = msg.chat.id							//chat_id of the sender
	let id = match['input'].split(' ')[1]		//id of the admin to add

	//checks if the sender is an admin
	if (! admins.includes(chatId)) {
		return
	}

	//checks if the id of the admin to add is valid (numeric)
	if (isNaN(id)) {
		bot.sendMessage(chatId, `The id must be 10 digits long!`)
		return
	}

	//checks if the user to add to the admin is alread yo one of them
	if (admins.includes(id)) {
		bot.sendMessage(chatId, `The user ${id} is already an admin`)
		return
	}

	//adding
	admins.push(id)

	//feedback
	bot.sendMessage(chatId, `The user ${id} just became an admin`)
	console.log(`${chatId} added ${id} as admin`)
	saveDB()
})


bot.onText(/\/admin_remove/, (msg, match) => {		// /admin_remove
	const chatId = msg.chat.id							//chat_id of the sender
	let id = match['input'].split(' ')[1]		//id of the admin to remove

	//checks if the sender of the command is an admin
	if (! admins.includes(chatId)) {
		return
	}

	//checks if the id of the admin to remove is valid (numeric)
	if (isNaN(id)) {
		bot.sendMessage(chatId, `The id must be 10 digits long!`)
		return
	}

	//chekcs if the id of the admin to remove is an actual admin
	if (! admins.includes(Number(id))) {
		bot.sendMessage(chatId, `The user ${id} is not an admin`)
		return
	}

	//remove the admin
	for (var i = 0; i < admins.length; i++) {
		if (admins[i] == id) {
			admins.splice(i, 1)
			break
		}
	}

	//feedback
	bot.sendMessage(chatId, `The user ${id} has just been removed by admins`)
	console.log(`${chatId} removed ${id} from admin`)
	saveDB()
})


bot.onText(/\/admin_list/, (msg) => {		//	/admin_list
	const chatId = msg.chat.id		//chat_id of the sender

	//checks if the sender is an admin
	if (admins.includes(chatId)) {
		bot.sendMessage(chatId, `List of admins: ${admins.join(', ')}`)
	}
})


bot.onText(/\/user_list/, (msg) => {		//	/user_list
	const chatId = msg.chat.id		//chat_id of the sender

	//checks if the sender is an admin
	if (admins.includes(chatId)) {
		bot.sendMessage(chatId, `List of users: ${start.join(', ')}`)
	}
})


bot.onText(/\/send/, (msg, match) => {		// /send
	const chatId = msg.chat.id		//chat_id of the sender

	//checks if the sender is an admin
	if (! admins.includes(chatId)) {
		return
	}
	
	let input = match['input'].split(' ')		//message sent by the user spliced at space
	let who = input[1].split('-')						//recipients
	let message = []												//message
	let good = []														//valid recipients
	let bad = []														//invalid recipients


	//checks if there is a message and a recipient
	if (input.length < 3) {
		bot.sendMessage(chatId, `You must specify the recipient and the message!`)
		return
	}

	//delete non numeric user_ids 
	for (let  i = 0; i < who.length; i++) {
		if (isNaN(who[i]) && who[i] != 'all') {
			who.splice(who[i], 1)
		}
	}

	//checks if there is at least one recipient left
	if (who.length <= 0) {
		bot.sendMessage(chatId, `You must specify at least one valid recipient!`)
		return
	}
	

	//all functionality
	if (who[0] == 'all') {
		for (let i = 0; i < start.length; i++) {
			who[i] = start[i]
		}
	}

	//message formation
	for (let i = 2; i < input.length; i++) {
		message.push(input[i])
	}

	message = message.join(' ')
	

	//sending of message			
	for (let i = 0; i < who.length; i++) {
		if (start.includes(Number(who[i]))) {
			bot.sendMessage(who[i], `An admin just sent you a message: ${message}`)
			good.push(who[i])
		} else {
			bad.push(who[i])
		}
	}


	//creation of the message for the feedbak for the user
	let end = ''

	if (good.length > 0) {
		end = 'Message sent to: '
		for (let i = 0; i < good.length; i++) {
			if (i == 0) {
				end = end + good[i]
			} else {
				end = end + ', ' + good[i]
			}
		}
	}

	if (bad.length > 0) {
		end += '\nMessage not sent to: '
		for (let i = 0; i < bad.length; i++) {
			if (i == 0) {
				end = end + bad[i]
			} else {
				end = end + ', ' + bad[i]
			}
		}
	}

	
	//feedback
	bot.sendMessage(chatId, end)
	console.log(`The admin ${chatId} sent the message '${message}' to ${good}`)
})




//	AUTO-UPDATE

setInterval(function() {
	let this_data = fs.readFileSync(path.basename(__filename), 'utf-8')	//data of this file
	
	axios
		.get('https://raw.githubusercontent.com/Tugamer89/telegram_bus-bot/main/index.js')
    .then(res => {
      let new_data = res.data		//data of the new file

			//check if data are different
      if (this_data != new_data) {
    		console.log('Updated!')
				//update the file
    		fs.writeFileSync(path.basename(__filename), new_data)
    	}
    })
    .catch(error => {console.log(error)});

}, 1000 * 60 * 15)  //Check every 15 minutes

