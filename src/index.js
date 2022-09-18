import fetch from 'node-fetch'
import iTunes from 'itunes-bridge'
import RPC from 'discord-rpc'
import { searchSong } from '@tbogard/itunes-search'

const iTunesEmitter = iTunes.emitter
let client = new RPC.Client({ transport: 'ipc' })
client.login({ clientId: '891586647790075964' }).catch(console.error)

iTunesEmitter.on('playing', async function (type, CurrentTrack) {
  const term = encodeURIComponent(`${CurrentTrack.artist} ${CurrentTrack.album}`)
  const resp = await fetch(`https://itunes.apple.com/search?media=music&entity=song&limit=1&term=${term}`)
  const readS = await resp.json()
  const artwork = readS.results[0]?.artworkUrl100 ?? null
  const url = readS.results[0]?.collectionViewUrl ?? null
  // console.log("readS: ", artwork);
  CurrentTrack.artwork = artwork
  CurrentTrack.url = url
  console.log('CurrentTrack: ', CurrentTrack)

  const details = {
    details: `${CurrentTrack.name}`,
    state: `โดย ${CurrentTrack.artist}`,

    timestamps: {
      end: Date.now() + CurrentTrack.remainingTime * 1000 + 1
    },
    assets: {
      large_image: artwork,
      large_text: CurrentTrack.name,
      small_image: `applemusic`,
      small_text: 'https://music.apple.com'
    }
  }

  if (!CurrentTrack.artist || !CurrentTrack.album) {
    console.log('ready: ')
    client.on('ready', () => {})
    client.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        ...details,
        buttons: [
          {
            label: 'Unable On Apple Music',
            url: url
          }
        ]
      }
    })
  } else {
    // console.log('searchSong: ')
    searchSong(`${CurrentTrack.artist} - ${CurrentTrack.name}`)
      .then((result) => {
        client.on('ready', () => {})
        client.request('SET_ACTIVITY', {
          pid: process.pid,
          activity: {
            ...details,
            buttons: [
              {
                label: 'Listen On Apple Music',
                url: url
              }
            ]
          }
        })
      })
      .catch((error) => {
        client.on('ready', () => {})
        client.request('SET_ACTIVITY', {
          pid: process.pid,
          activity: {
            ...details,
            buttons: [
              {
                label: 'Unable On Apple Music',
                url: url
              }
            ]
          }
        })
      })
  }
})
iTunesEmitter.on('paused', function (type, CurrentTrack) {
  client.request('SET_ACTIVITY', { pid: process.pid })
  console.log(`${CurrentTrack.name} is stopped`)
})
iTunesEmitter.on('stopped', function () {
  client.on('ready', () => {})
  client.request('SET_ACTIVITY', { pid: process.pid })
  console.log(`Apple Music is stopped.`)
})
