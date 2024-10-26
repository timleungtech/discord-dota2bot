## Summary
Discord dota2bot checks OpenDota API for new recent matches of USERS every 'n' minutes. When new recent match is found, dota2bot posts a game summary as a message in a specified Discord channel. 

## Installation
1. npm install
2. create bot in discord developer portal
3. grab app token and add to .env
4. enable dev mode on discord to enable copy channel_id for interactions
5. add channel_id to .env
6. node index.js

## Commands
* $player <account_id>
* $refresh

## Room for improvement
Create database:
* saves data during server crashes
* disallow commands affecting other servers with dota2bot
* allow channel switching
* allow tracking of more than one user
* allow shortnames for users instead of account_id

```
/dota2bot database
└── discord servers
    └── document
        ├── server_id : {server_id}
        ├── channel_id : {channel_id}
└── players
    └── document
        ├── account_id : {account_id}
        ├── name : {name}
        └── match_id : {match_id}
└── heroes
    └── document
        ├── hero_id : {hero_id}
        ├── localized_name : {localized_name}
```

![preview](https://raw.githubusercontent.com/timleungtech/discord-dota2bot/main/example.png)
