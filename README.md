# Telegram census bot
That's a very basic telegram bot made by me

this bot was created to register buses by storing the code, number, date and time and allows you to download the database in CSV format

Feel free to contact me for more suggestions or if you find a bug!

<br>

## **Known bugs:**
  - Hours are not stored properly (24:xx, 26:xx)
  - Don't checks if userIds and message are correct in `/send`
  - The code is shit!

<br>

## **Future implementations:**
  - Add buttons
  - Improve the reading and writing of files
  - Use the time zone of the user
  
<br>

## **Changelog:**

## **Version 1.0.2**
  - Added the auto-registration of users
  - Added list of admins who can:
	  - Send messages to everyone or only someone
	  - Add more admins
    - Remove admins
    - List all admins
    - List all users
 

### **Version 1.0.1**
  - Added auto-update
	  - To let it work properly run the server with `nodemon`

### **Version 1.0.0**
  - Added the registration to the daily newsletter at a specific time
  - Added the unregistration to the newsletter
  - Added the saving of a bus at a manually set date and time
  - Added the saving of a bus at an automatically set date and time
  - Added the removing of the last bus or one manually chosen
  - Added the sending of the database in CSV format
  - Optimized and improved some code
  - Fixed some minor bugs

<br>

## **How to use**
  - `/start` to start the bot
  - `/help` to show all the commands and their usage
  - `/register [time]` to register to the newsletter at the selected time, if you don't specify it's 23:00 CET
	  - The time must be hh:mm. It supports different hour formats: 04:2 = 04:02, 4:20 = 04:20, 4:2 = 04:02
    - Example: `/register 04:20`
  - `/unregister` to unregister to the newsletter
  - `/add [Weekday] [day] [Month] [year] [time] [code] [number]` to manually save a bus
	  - The weekday must be in english, full and with the first capital letter
	  - The day must be a number and must exist in the month
	  - The month must be in english, full and with the first capital letter
	  - The year must be between 2 years ago and the current year
	  - The time must be hh:mm. It supports different hour formats: 04:2 = 04:02, 4:20 = 04:20, 4:2 = 04:02
    - The code must be 4 digits long
    - The number must be between 1 and 999
    - Example: `/add Friday 6 May 2022 4:40 1234 56`
  - `[code] [number]` to automatically save a bus
	  - The code must be 4 digits long
    - The number must be between 1 and 999
    - Example: `1234 567`
  - `/remove [line]` to remove a line from the database, if you don't specify it's the last one
	  - The line must be between 1 and the last one of the specific database
    - Example: `/remove 21`
  - `Send me the CSV` to send the database in the CSV format

  ### Only for admins:
  - `/admin_add [user_id]` to add another admin from user_id
    - Example: `/admin_add 1234567890` 
  - `/admin_remove [user_id]` to remove an admin from user_id
    - Example: `/admin_remove 1234567890`
  - `/admin_list` to list all admins
  - `/user_list` to list all users
  - `/send [user_ids] {[message]}` to send a message to the specified users
	  - It supports sending messages to everyone: `all`
    - The users must be separated by `-` 
    - Example: `/send 1234567890-123456791 {this is a message}` 
	


 