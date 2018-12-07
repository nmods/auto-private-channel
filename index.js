const path = require('path');
const fs = require('fs');
const serverList = [
	{ id: 27, name: 'Mystel' },
	{ id: 26, name: 'Killian' },
	{ id: 29, name: 'Seren' },
	{ id: 28, name: 'Yurian' },
	{ id: 90, name: 'Baldrov' },
	{ id: 91, name: 'Atmorph' },
	{ id: 4105, name: 'Velika' },
	{ id: 4107, name: 'Kaiator' }];

module.exports = function auto_private_channel(mod) {
	const command = mod.command || mod.require.command;
	let config,
		current = 0,
		joinedChannels = {},
		waitingTimeout = null

	try {
		config = require('./config.json')
	} catch (error) {
		config = []
	}

	command.add('private', (cmd, name, pass, ...servers) => {
		switch (cmd) {
			case 'add':
			case 'join':
				if (!name) {
					command.message('Name required')
					return;
				}
				if (!pass || pass.length != 4 || !/\d{4}/.test(pass)) {
					command.message('4-digit password required')
					return;
				}
				if (servers.length == 0) {
					servers = [mod.game.me.serverId]
				} else if (servers[0] != 'all'){
					servers = servers.map(x =>{
						if(/\d+/.test(x)) return parseInt(x)
						else return x.toLowerCase()
					})
					let serverNames = serverList.map(y => y = y.name.toLowerCase())
					let serverIds = serverList.map(y => y = y.id)
					if (servers.every(x => serverNames.includes(x) || serverIds.includes(x))) {
						for (let i = 0; i < servers.length; i++) {
							if (!/\d+/.test(servers[i])) servers[i] = serverIds[serverNames.indexOf(servers[i].toLowerCase())]
						}
					} else {
						command.message('Invalid servers in server list.')
						command.message('Valid server names: ' + serverNames.join(', '))
						command.message('Valid server IDs: ' + serverIds.join(', '))
						return;
					}
				}

				let alreadyJoined = Object.values(joinedChannels).some(x => x == name)
				let newEntry = {
					channelName: name,
					channelPass: pass,
					server: servers,
					joined: alreadyJoined
				}
				config.push(newEntry)
				if (!alreadyJoined) {
					current = config.length - 1
					joinChannel(newEntry)
				}
				command.message('Added channel ' + name + ' to auto-join config' + (alreadyJoined ? '.' : ' and joined it automatically.'))
				break;
			case 'remove':
			case 'leave':
			case 'delete':
				if (!name) {
					command.message('Name required')
					return;
				}
				let entry = config.find(x => x.channelName.toLowerCase() == name.toLowerCase())
				if (!entry) {
					command.message('Channel ' + name + ' not found.')
					return;
				}
				leaveChannel(entry)
				let index = config.findIndex(x => x.channelName == name)
				if(index != -1) config.splice(index,1)				
				
				command.message('Left channel ' + name + ' and removed it from auto-join config.')
				break;
			case 'debug':
				console.log(config)
				break;
			default:
				command.message('Autojoin channels: ' + config.map(x => x = x.channelName).join(', '))
				command.message('Currently joined channels: ' + Object.values(joinedChannels).join(', '))
				break;
		}
		saveConfig()
	})

	mod.game.on('enter_game', reset)


	mod.hook('S_LOAD_CLIENT_USER_SETTING', 'raw', () => {
		joinChannel(getNextChannel(0))
	})

	mod.hook('S_JOIN_PRIVATE_CHANNEL', 2, (event) => {
		joinedChannels[event.index] = event.name
		if (event.name.toLowerCase() == config[current].channelName.toLowerCase()) {
			config[current].joined = true
			clearTimeout(waitingTimeout)
			joinChannel(getNextChannel(current + 1))
		}

	})
	mod.hook('S_LEAVE_PRIVATE_CHANNEL', 2, (event) => {
		delete joinedChannels[event.index]
	})

	mod.hook('S_SYSTEM_MESSAGE', 1, (event) => {
		let entry = config[current]
		if (!waitingTimeout) return
		data = mod.parseSystemMessage(event.message);
		if (data.id == 'SMT_CAHT_CHANNEL_NAME_IS_NONEXISTENT') {
			clearTimeout(waitingTimeout)
			createChannel(entry)
			return false
		}
	});

	function getNextChannel(start) {
		for (let i = start; i < config.length; i++) {
			if (!config[i].joined && (config[i].server[0] == 'all' || config[i].server.includes(mod.game.me.serverId))) {
				current = i
				return config[i]
			}
		}
		return null
	}

	function joinChannel(entry) {
		if (!entry) return
		mod.send('C_JOIN_PRIVATE_CHANNEL', 1, {
			password: entry.channelPass,
			name: entry.channelName
		})
		waitingTimeout = setTimeout(() => {
			mod.command.message('Something went wrong joining ' + entry.channelName + ', try joining manually');
		}, 1000)
	}
	function createChannel(entry) {
		mod.send('C_CREATE_PRIVATE_CHANNEL', 1, {
			password: entry.channelPass,
			name: entry.channelName,
			members: []
		})
	}
	function leaveChannel(entry) {
		let i = Object.keys(joinedChannels).find(key =>joinedChannels[key] == entry.channelName)
		if(!i) return
		mod.send('C_LEAVE_PRIVATE_CHANNEL', 1, {
			index: i
		})
	}

	function reset() {
		joinedChannels = {}
		for (let entry of config) {
			entry.joined = false
		}
	}

	function saveConfig() {
		fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(
			config, null, '\t'), err => {
			});
	}

	this.destructor = () => {
		clearTimeout(waitingTimeout)
		command.remove('private')
		mod.game.removeListener('enter_game', reset)
	};
};