## Summary
Discord dota2bot checks OpenDota API for new recent matches of USERS every 'n' minutes. When new recent match is found, dota2bot posts a game summary as a message in a specified Discord channel. 

## Installation
1. npm install
2. create bot in discord developer portal
3. grab app token and add to config/config.env
4. enable dev mode on discord to enable copy channel_id for interactions
5. add channel_id to config/config.env
6. create mongodb db, grab URI, and add to config/config.env
7. node index.js

## Commands
* $list
* $track <ref_name>
* $insert <ref_name> <account_id>

## Room for improvement
* disallow commands affecting other servers with dota2bot
* allow channel switching

```
/dota2bot database
└── servers
    └── document
        ├── server_id : 'server_id'
        ├── channel_id : 'channel_id'
        ├── players_tracking : []
└── players
    └── document
        ├── account_id : account_id
        ├── name : 'name'
        └── match_id : match_id
└── heroes
    └── document
        ├── hero_id : hero_id
        ├── localized_name : 'localized_name'
```

![preview](https://raw.githubusercontent.com/timleungtech/discord-dota2bot/main/example.png)
