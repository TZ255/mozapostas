const router = require('express').Router()
const mkekadb = require('../model/mkeka-mega')
const supatips = require('../model/supatips')
const betslip = require('../model/betslip')
const venas15Model = require('../model/venas15')
const venas25Model = require('../model/venas25')
const graphModel = require('../model/graph-tips')
const affModel = require('../model/affiliates-analytics')
const bttsModel = require('../model/btts')
const axios = require('axios').default
const cheerio = require('cheerio')

//times
const TimeAgo = require('javascript-time-ago')
const en = require('javascript-time-ago/locale/en')
const { WeekDayFn } = require('./fns/weekday')
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

router.get('/', async (req, res) => {
    try {
        //leo
        let nd = new Date()
        let d = nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let d_juma = nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })
        //jana
        let _nd = new Date()
        _nd.setDate(_nd.getDate() - 1)
        let _d = _nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _d_juma = _nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })
        //juzi
        let _jd = new Date()
        _jd.setDate(_jd.getDate() - 2)
        let _s = _jd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _s_juma = _jd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })
        //kesho
        let new_d = new Date()
        new_d.setDate(new_d.getDate() + 1)
        let kesho = new_d.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let k_juma = new_d.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //mikeka mega
        let mikeka = await mkekadb.find({ date: d }).sort('time');

        // Function to subtract one hour from a time string in "HH:MM" format for Mozambique from Tanzania
        const subtractOneHour = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            let newHours = (hours - 1 + 24) % 24; // Ensure the hours wrap around properly
            return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        // Update the mikeka array
        mikeka = mikeka.map(match => ({
            ...match.toObject(), // Convert to plain object if needed
            time: subtractOneHour(match.time), // Subtract one hour from the time
        }));

        //Get Slips
        let slip = await betslip.find({ date: d })

        let megaOdds = 1
        let slipOdds = 1

        for (let m of mikeka) {
            megaOdds = (megaOdds * m.odds).toFixed(2)
        }
        for (let od of slip) {
            slipOdds = (slipOdds * od.odd).toFixed(2)
        }

        //supatip zote
        let allSupa = await supatips.find({ siku: { $in: [d, _d, _s, kesho] } }).sort('time')

        // Update the supatips array
        allSupa = allSupa.map(match => ({
            ...match.toObject(), // Convert to plain object if needed
            time: subtractOneHour(match.time), // Subtract one hour from the time
        }));

        //supatips leo
        let stips = allSupa.filter(doc => doc.siku == d)

        //supatip ya jana
        let ytips = allSupa.filter(doc => doc.siku == _d)

        //supatip ya juzi
        let jtips = allSupa.filter(doc => doc.siku == _s)

        //supatip ya kesho
        let ktips = allSupa.filter(doc => doc.siku == kesho)


        //tarehes
        let trh = { leo: d, kesho, jana: _d, juzi: _s }
        let jumasiku = { juzi: WeekDayFn(_s_juma), jana: WeekDayFn(_d_juma), leo: WeekDayFn(d_juma), kesho: WeekDayFn(k_juma) }


        res.render('1-home/home', { megaOdds, mikeka, stips, ytips, ktips, jtips, slip, slipOdds, trh, jumasiku })
    } catch (err) {
        console.log(err.message, err)
        let tgAPI = `https://api.telegram.org/bot${process.env.LAURA_TOKEN}/copyMessage`
        await axios.post(tgAPI, {
            chat_id: 741815228,
            from_chat_id: -1001570087172, //matangazoDB
            message_id: 197
        }).catch(e => console.log(e.message, e))
    }

})

router.get('/:comp/register', async (req, res) => {
    const comp = req.params.comp
    let links = {
        betway: `https://www.betway.co.mz/?btag=P94949-PR27078-CM92269-TS1971458&`,
        bet22: `https://welcome.toptrendyinc.com/redirect.aspx?pid=77675&bid=1634`,
        bet888: `https://media.888africa.com/C.ashx?btag=a_416b_446c_&affid=356&siteid=416&adid=446&c=`,
        betwinner: `https://bwredir.com/29lg?extid=mkl&p=%2Fregistration%2F`,
        pmatch: `https://grwptraq.com/?serial=61309478&creative_id=3960`
    }
    try {
        switch (comp) {
            case 'betway':
                res.redirect(links.betway);
                break;
            case 'pmatch':
                res.redirect(links.pmatch);
                break;
            case '888bet':
                res.redirect(links.bet888);
                break;
            case 'betwinner':
                res.redirect(links.betwinner);
                break;
            default:
                res.redirect('/');
                break;
        }
    } catch (err) {
        console.log(err.message)
    }
})

router.get('/contact/telegram', (req, res) => {
    res.redirect('https://t.me/+n7Tlh61oNjYyODU0')
})

router.get('/tips/vip', async (req, res) => {
    try {
        let d = new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let slip = await betslip.find({ date: d })

        //reformat mozambique hours fn
        const subtractOneHour = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            let newHours = (hours - 1 + 24) % 24; // Ensure the hours wrap around properly
            return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        // Update the betslip array
        slip = slip.map(match => ({
            ...match.toObject(), // Convert to plain object if needed
            time: subtractOneHour(match.time), // Subtract one hour from the time
        }));

        let slipOdds = 1
        for (let od of slip) {
            slipOdds = (slipOdds * od.odd).toFixed(2)
        }

        let jumasiku = { juzi: WeekDayFn(_s_juma), jana: WeekDayFn(_d_juma), leo: WeekDayFn(d_juma), kesho: WeekDayFn(k_juma) }
        res.render('3-landing/landing', { slip, slipOdds, jumasiku })
    } catch (err) {
        console.log(err.message)
    }
})

router.get('/tips/over-15', async (req, res) => {
    try {
        let nd = new Date()
        let d = nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let d_juma = nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //venas15 ya jana
        let _nd = new Date()
        _nd.setDate(_nd.getDate() - 1)
        let _d = _nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _d_juma = _nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //venas15 ya juzi
        let _jd = new Date()
        _jd.setDate(_jd.getDate() - 2)
        let _s = _jd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _s_juma = _jd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //venas15 ya kesho
        let new_d = new Date()
        new_d.setDate(new_d.getDate() + 1)
        let kesho = new_d.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let k_juma = new_d.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        let Alltips = await venas15Model.find({ siku: { $in: [d, kesho, _d, _s] } }).sort('time').select('time league siku match tip matokeo')

        //fn to modify time
        const subtractOneHour = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            let newHours = (hours - 1 + 24) % 24; // Ensure the hours wrap around properly
            return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        // Update AllTips Time
        Alltips = Alltips.map(match => ({
            ...match.toObject(), // Convert to plain object if needed
            time: subtractOneHour(match.time), // Subtract one hour from the time
        }));

        let ktips = Alltips.filter(doc => doc.siku === kesho)
        let jtips = Alltips.filter(doc => doc.siku === _s)
        let ytips = Alltips.filter(doc => doc.siku === _d)
        let stips = Alltips.filter(doc => doc.siku === d)

        //tarehes
        let trh = { leo: d, kesho, jana: _d, juzi: _s }
        let jumasiku = { juzi: WeekDayFn(_s_juma), jana: WeekDayFn(_d_juma), leo: WeekDayFn(d_juma), kesho: WeekDayFn(k_juma) }

        res.render('5-over15/over15', { stips, ytips, ktips, jtips, trh, jumasiku })
    } catch (err) {
        console.error(err)
        let tgAPI = `https://api.telegram.org/bot${process.env.LAURA_TOKEN}/copyMessage`
        await axios.post(tgAPI, {
            chat_id: 741815228,
            from_chat_id: -1001570087172, //matangazoDB
            message_id: 125
        }).catch(e => console.log(e.message, e))
    }
})

router.get('/tips/over-25', async (req, res) => {
    try {
        let nd = new Date()
        let d = nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let d_juma = nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //venas25 ya jana
        let _nd = new Date()
        _nd.setDate(_nd.getDate() - 1)
        let _d = _nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _d_juma = _nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //venas25 ya juzi
        let _jd = new Date()
        _jd.setDate(_jd.getDate() - 2)
        let _s = _jd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _s_juma = _jd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //venas25 ya kesho
        let new_d = new Date()
        new_d.setDate(new_d.getDate() + 1)
        let kesho = new_d.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let k_juma = new_d.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        let Alltips = await venas25Model.find({ siku: { $in: [d, kesho, _d, _s] } }).sort('time').select('time league siku match tip matokeo')

        //Time modification
        const subtractOneHour = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            let newHours = (hours - 1 + 24) % 24; // Ensure the hours wrap around properly
            return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        // Update the array
        Alltips = Alltips.map(match => ({
            ...match.toObject(), // Convert to plain object if needed
            time: subtractOneHour(match.time), // Subtract one hour from the time
        }));

        let ktips = Alltips.filter(doc => doc.siku === kesho)
        let jtips = Alltips.filter(doc => doc.siku === _s)
        let ytips = Alltips.filter(doc => doc.siku === _d)
        let stips = Alltips.filter(doc => doc.siku === d)

        //tarehes
        let trh = { leo: d, kesho, jana: _d, juzi: _s }
        let jumasiku = { juzi: WeekDayFn(_s_juma), jana: WeekDayFn(_d_juma), leo: WeekDayFn(d_juma), kesho: WeekDayFn(k_juma) }

        res.render('6-over25/over25', { stips, ytips, ktips, jtips, trh, jumasiku })
    } catch (err) {
        console.error(err)
        let tgAPI = `https://api.telegram.org/bot${process.env.LAURA_TOKEN}/copyMessage`
        await axios.post(tgAPI, {
            chat_id: 741815228,
            from_chat_id: -1001570087172, //matangazoDB
            message_id: 196
        }).catch(e => console.log(e.message, e))
    }
})

router.get('/tips/mega-odds-de-hoje', async (req, res) => {
    try {
        let nd = new Date()
        let d = nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let d_juma = nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //mega odds za jana
        let _nd = new Date()
        _nd.setDate(_nd.getDate() - 1)
        let _d = _nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _d_juma = _nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //mega odds za juzi
        let juzi = new Date()
        juzi.setDate(juzi.getDate() - 2)
        let juziD = juzi.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let juzi_juma = juzi.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })


        //mega za kesho
        let new_d = new Date()
        new_d.setDate(new_d.getDate() + 1)
        let kesho = new_d.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let k_juma = new_d.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        let Alltips = await mkekadb.find({ date: { $in: [d, _d, juziD, kesho] } }).sort('time').select('time league date match bet odds')

        //modify time
        const subtractOneHour = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            let newHours = (hours - 1 + 24) % 24; // Ensure the hours wrap around properly
            return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        // Update the mikeka array
        Alltips = Alltips.map(match => ({
            ...match.toObject(), // Convert to plain object if needed
            time: subtractOneHour(match.time), // Subtract one hour from the time
        }));

        let ktips = Alltips.filter(tip => tip.date === kesho)
        let stips = Alltips.filter(tip => tip.date === d)
        let ytips = Alltips.filter(tip => tip.date === _d)
        let jtips = Alltips.filter(tip => tip.date === juziD)

        //tarehes
        let trh = { leo: d, kesho, jana: _d, juzi: juziD }
        let jumasiku = { juzi: WeekDayFn(juzi_juma), jana: WeekDayFn(_d_juma), leo: WeekDayFn(d_juma), kesho: WeekDayFn(k_juma) }

        res.render('7-mega/mega', { stips, ytips, ktips, jtips, trh, jumasiku })
    } catch (err) {
        console.error(err)
        let tgAPI = `https://api.telegram.org/bot${process.env.LAURA_TOKEN}/copyMessage`
        await axios.post(tgAPI, {
            chat_id: 741815228,
            from_chat_id: -1001570087172, //matangazoDB
            message_id: 196
        }).catch(e => console.log(e.message, e))
    }
})

router.get('/tips/over-05-first-half', async (req, res) => {
    try {
        //leo
        let nd = new Date()
        let d = nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let d_juma = nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })
        //jana
        let _nd = new Date()
        _nd.setDate(_nd.getDate() - 1)
        let _d = _nd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _d_juma = _nd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })
        //juzi
        let _jd = new Date()
        _jd.setDate(_jd.getDate() - 2)
        let _s = _jd.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let _s_juma = _jd.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })
        //kesho
        let new_d = new Date()
        new_d.setDate(new_d.getDate() + 1)
        let kesho = new_d.toLocaleDateString('en-GB', { timeZone: 'Africa/Maputo' })
        let k_juma = new_d.toLocaleString('en-GB', { timeZone: 'Africa/Maputo', weekday: 'long' })

        //mikeka ya kuchukua
        let arr = ['Over 2.5', 'Over 2.5 Goals', 'GG', 'Over 3.5', 'Over 3.5 Goals', 'Away Total. Over 1.5', 'Home Total. Over 1.5', 'GG & Over 2.5', '2 & GG', '1 & GG', '2 & Over 2.5', '2 & Over 1.5', '1 & Over 2.5', '1 & Over 1.5', '12 & GG', 'X2 & GG', '1X & GG', '2/2', '1/1', '1st Half. Over 0.5']
        let over05Tips = await mkekadb.find({
            date: { $in: [d, _d, _s, kesho] },
            bet: { $in: arr }
        }).sort('time')

        //modify time
        const subtractOneHour = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            let newHours = (hours - 1 + 24) % 24; // Ensure the hours wrap around properly
            return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        // Update the mikeka array
        over05Tips = over05Tips.map(match => ({
            ...match.toObject(), // Convert to plain object if needed
            time: subtractOneHour(match.time), // Subtract one hour from the time
        }));

        //tarehes
        let trh = { leo: d, kesho, jana: _d, juzi: _s }
        let jumasiku = { juzi: WeekDayFn(_s_juma), jana: WeekDayFn(_d_juma), leo: WeekDayFn(d_juma), kesho: WeekDayFn(k_juma) }

        //filter
        let stips = over05Tips.filter(doc => doc.date === d)
        let ytips = over05Tips.filter(doc => doc.date === _d)
        let ktips = over05Tips.filter(doc => doc.date === kesho)
        let jtips = over05Tips.filter(doc => doc.date === _s)

        res.render('9-over05/over05', { stips, ytips, ktips, jtips, trh, jumasiku })
    } catch (err) {
        console.error(err)
        let tgAPI = `https://api.telegram.org/bot${process.env.LAURA_TOKEN}/copyMessage`
        await axios.post(tgAPI, {
            chat_id: 741815228,
            from_chat_id: -1001570087172, //matangazoDB
            message_id: 196
        }).catch(e => console.log(e.message, e))
    }
})

//articles
router.get('/article/:path', async (req, res) => {
    try {
        let path = req.params.path
        let dt = {
            mwaka: new Date().getFullYear()
        }

        switch (path) {
            case 'dicas-para-ganhar-apostas':
                res.render('4-articles/mbinu/mbinu');
                break;

            case 'melhores-empresas-de-apostas-mocambique':
                res.render('4-articles/kampuni/kampuni', { dt })
                break;

            default:
                res.redirect('/');
        }
    } catch (err) {
        console.log(err.message)
    }
})

router.get('*', (req, res) => {
    res.redirect('/')
})

module.exports = router