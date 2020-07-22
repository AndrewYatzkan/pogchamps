// const fs = require('fs')
const fetch = require('node-fetch')
const players = require('./players.js')
const DEFAULT_CHESS_RATING = 1200
const DEFAULT_LICHESS_RATING = 1200
const VARIANT = 'Blitz'
const MONTHS = [5, 6, 7]
const YEAR = 2020

function getSite(url) {
    return url.indexOf('chess.com') > -1 ? 'chess' : 'lichess'
}

function getUsername(url) {
    var arr = url.split('/')
    return arr[arr.length - 1]
}

function end_timeToDate(time) {
    var d = new Date(time*1000);
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
}

function equal(a, b) {
    if ((!a || !b) || (a.length != b.length)) return false;
    for (i in a) {
        if (a[i] != b[i]) return false;
    }
    return true;
}

function onePerDayMax(data) {
    for (var i = 1; i < data.length - 1; i++) {
        var currentDate = data[i].slice(0, 3)
        var nextDate = data[i + 1].slice(0, 3)
        if (equal(currentDate, nextDate)) data[i] = false
    }
    return data.filter(i => i)
}

async function getRatingHistory(username='Andrew-9', variant='Blitz', site='lichess', months=[5, 6], year=2020) {
    var variantHistory = []
    if (site == 'lichess') {
        var req = await fetch(`https://lichess.org/api/user/${username}/rating-history`)
        var res = (await req.json()).filter(i => i.name == variant)[0].points
        variantHistory = res.filter(i => {
                                return i[0] == year && months.includes(i[1] + 1)
                            })
                            .map(i => [i[0], i[1] + 1, i[2], i[3]]) // January: 0 -> January: 1
        var index = res.length - 1 // i think the next two lines work.. i haven't tested them
        for (i in res) if (equal(res[i], variantHistory[0])) index = i - 1
        variantHistory = [index < 0 ? [0, 0, 0, DEFAULT_LICHESS_RATING] : res[index], ...variantHistory]
    } else if (site == 'chess') {
        var req = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`)
        var res = (await req.json()).archives
        var archives = []
        for (i in res) {
            var archive = res[i]
            var [_, archiveYear, archiveMonth] = archive.match(/(\d+)\/(\d+)$/).map(i => parseInt(i))
            if (archiveYear == year && months.includes(archiveMonth)) {
                if (!archives.length) archives.push(i - 1)
                archives.push(archive)
            }
        }
        var index = archives[0]
        archives[0] = res[index] // set the first archive to the one before the earliest one that we care about. might be undefined, we'll take care of that later
        for (var i = 0; i < archives.length; i++) {
            var archive = archives[i]
            if (!archive) {
                variantHistory.push([0, 0, 0, DEFAULT_CHESS_RATING])
                continue
            }
            req = await fetch(archive)
            res2 = (await req.json()).games
                .filter(i => i.rated && i.time_class == variant.toLowerCase() && i.rules == 'chess')
                .map(i => [i.end_time, [i.white, i.black].filter(j => j.username.toLowerCase() == username.toLowerCase())[0].rating])
            if (i == 0) res2 = res2.slice(-1)
            if (!res2.length && i == 0) {
                if (index > 0) {
                    index--
                    i--
                    archives[0] = res[index]
                } else {
                    variantHistory.push([0, 0, 0, DEFAULT_CHESS_RATING])
                    continue
                }
            }
            for (game of res2) {
                variantHistory.push([...end_timeToDate(game[0]), game[1]])
            }
        }
    }
    return variantHistory
}
(async () => {
    var playerRatings = JSON.parse(JSON.stringify(players))
    for (player of Object.keys(playerRatings)) {
        var username = getUsername(players[player])
        var site = getSite(players[player])
        console.log(`Fetching ${username}'s profile.`)
        playerRatings[player] = await getRatingHistory(username, VARIANT, site, MONTHS, YEAR)
        if (site != 'lichess') playerRatings[player] = onePerDayMax(playerRatings[player])
    }
    console.log(JSON.stringify(playerRatings))
    
    // var playerRatings = {"Boxbox":[[0,0,0,1200],[2020,5,4,891],[2020,5,5,978],[2020,5,6,992],[2020,5,7,1000],[2020,5,8,1038],[2020,5,9,1022],[2020,5,10,1015],[2020,5,11,1029],[2020,5,12,1052],[2020,5,13,1076],[2020,5,14,1149],[2020,5,15,1138],[2020,5,16,1122],[2020,5,21,1135],[2020,5,23,1126],[2020,5,24,1126],[2020,5,26,1117],[2020,5,30,1111]],"Yassuo":[[0,0,0,1200],[2020,5,3,1181],[2020,5,4,1057],[2020,5,5,1063],[2020,5,8,1111],[2020,5,9,1091],[2020,5,10,967],[2020,5,11,959],[2020,5,13,940],[2020,5,14,949],[2020,5,15,932],[2020,5,16,930],[2020,5,17,908],[2020,5,18,897],[2020,5,19,901],[2020,5,21,894],[2020,5,23,885],[2020,5,25,836],[2020,5,26,812],[2020,5,27,808],[2020,5,28,806],[2020,5,29,776],[2020,5,30,717],[2020,5,31,725],[2020,6,1,733]],"Voyboy":[[2015,5,20,1357],[2020,5,5,1357],[2020,5,12,1447],[2020,5,14,1671]],"xChocobars":[[0,0,0,1200],[2020,5,22,608],[2020,5,30,874],[2020,5,31,816]],"fuslie":[[0,0,0,1200],[2020,5,21,988],[2020,5,22,874],[2020,5,26,701]],"NymN":[[0,0,0,1200],[2020,5,13,910],[2020,5,14,748],[2020,5,15,712],[2020,5,16,745],[2020,5,17,743],[2020,5,18,804],[2020,5,19,810],[2020,5,20,818],[2020,5,25,783],[2020,5,31,766],[2020,6,1,751]],"Lex Veldhuis":[[2020,3,27,671]],"ItsSlikeR":[[0,0,0,1200],[2020,5,13,646],[2020,5,14,1261],[2020,5,15,1122],[2020,5,16,1052],[2020,5,17,1019],[2020,5,18,969],[2020,5,19,957],[2020,5,20,948],[2020,5,21,933],[2020,5,22,914],[2020,5,23,912],[2020,5,24,905],[2020,5,25,887],[2020,5,26,890],[2020,5,27,857],[2020,5,28,848],[2020,5,29,823],[2020,5,30,828],[2020,5,31,787],[2020,6,1,805]],"xQc":[[2020,4,2,675],[2020,5,4,556],[2020,5,5,589],[2020,5,6,573],[2020,5,7,585],[2020,5,8,555],[2020,5,9,552],[2020,5,10,585],[2020,5,11,645],[2020,5,12,619],[2020,5,13,601],[2020,5,14,579],[2020,5,15,587],[2020,5,16,617],[2020,5,17,617],[2020,5,18,622],[2020,5,19,600],[2020,5,20,590],[2020,5,21,594],[2020,5,22,597],[2020,5,23,587],[2020,5,24,565],[2020,5,25,611],[2020,5,26,694],[2020,5,27,726],[2020,5,28,702],[2020,5,29,727],[2020,5,30,707],[2020,5,31,706]],"LIRIK":[[0,0,0,1200],[2020,5,26,633],[2020,5,27,381]],"Reckful":[[2018,11,27,1000],[2020,5,17,869],[2020,5,18,823],[2020,5,19,804],[2020,5,20,818],[2020,5,27,812],[2020,5,28,855],[2020,5,29,897],[2020,5,30,954],[2020,5,31,1013]],"Forsen":[[2018,11,5,1332]],"moistcr1tikal":[[0,0,0,1200],[2020,5,5,619],[2020,5,12,582],[2020,5,15,535],[2020,5,27,582],[2020,5,29,600],[2020,5,30,624],[2020,6,1,616]],"Lugwig":[[2018,11,28,592],[2020,5,25,645],[2020,5,26,1013],[2020,5,27,960],[2020,5,28,921],[2020,5,29,957],[2020,5,31,948],[2020,6,1,970]]}
    // fs.writeFile('data.json', JSON.stringify(playerRatings), 'utf8', err => {
    //     if (err) throw err
    //     console.log('Data updated!')
    // })
})()