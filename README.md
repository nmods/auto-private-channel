# Auto-private-channel

Module for Tera proxy
Automatically joins or creates private channels. Useful when you want multiple characters to be in your private channels or when maintenance deletes your channels.
Configurable either in `config.json` or in game via commands
EU and NA only.

Opcodes for EU: (If NA, find out codes for yourself.)
```
C_CREATE_PRIVATE_CHANNEL = 40660
C_JOIN_PRIVATE_CHANNEL = 50494
```
Add them to your `proxy\node_modules\tera-data\map\protocol.343315.map` file

### commands
All commands start with `/8 private`

| Command | Arguments | Info | Required |
| ------- | --------- | ------- | ------|
| `add`/`join` | `name`,`pass`,`servers`| Adds a private channel to the config and joins it if not already joined | |
|  | `name`| Name of the private channel. Case-sensitive | YES |
|  | `pass`| 4-digit password of the private channel | YES |
|  | `servers`| Servers you want auto-join to be active on. Separate by space. Can be `'all'` for all servers. If left empty, will default to your current server. | NO |
| `remove`/`leave`/`delete` | `name` | Leaves a channel and removes it from autojoin config. | |
| | `name` | Name of the private channel. Not case-sensitive | YES
| empty | | Prints joined channels and autojoin-enabled channels into in-game chat |

#### examples
`/8 private add MyChannel 1234 killian mystel` 
`/8 private remove mychannel`
`/8 private`

### config file format
```json
[
	{
		"channelName": "MyChannel",
		"channelPass": "1234",
		"server": [
			26,
			27
		]
	},
	{
		"channelName": "AnotherChannel",
		"channelPass": "4321",
		"server": [
			26,
			27
		]
	}
]
```