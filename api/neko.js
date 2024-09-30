const axios = require('axios');
const url = require('url');

async function curl(targetUrl) {
    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) ChromeHD/52.0.2743.82 Safari/537.36',
                'Referer': targetUrl
            }
        });
        let result = response.data.replace(/\n/g, '');
        return result;
    } catch (error) {
        console.error('Error fetching the URL:', error);
        return null;
    }
}

module.exports = async (req, res) => {
    const hostname = req.headers.host; 
    const queryObject = url.parse(req.url, true).query;

    let result;
    if (queryObject.page != undefined) {
        result = await curl('https://nekopoi.care/page/' + queryObject.page);
    } else {
        result = await curl('https://nekopoi.care');
    }

    const replace = /<div class="eropost">(.*?)<soan>/gs;
    const resultjson = [];
    let match;
    while ((match = replace.exec(result)) !== null) {
        resultjson.push(match[1]); 
    }

    const resulthref = [];
    const replacehref = /<a href="https:\/\/nekopoi.care\/(.*?)\/">(.*?)<\/a>/g;
    const resultImages = [];
    const imagePattern = /<img src="(.*?)">/g;
    const replaceSpanUploaded = /<span>(.*?)<\/span>/g;
    const resultUploaded = [];

    resultjson.forEach(datajson => {
        let match3;
        while ((match3 = imagePattern.exec(datajson)) !== null) {
            resultImages.push(match3[1]); 
        }
    });

    resultjson.forEach(datajson => {
        let match4;
        while ((match4 = replaceSpanUploaded.exec(datajson)) !== null) {
            resultUploaded.push(match4[1]); 
        }
    });

    const allDates = resultUploaded.filter(item => {
        return /^\w+, \w+ \d{1,2}(st|nd|rd|th), \d{4}$/.test(item);
    });

    resultjson.forEach(datajson => {
        let match2;
        while ((match2 = replacehref.exec(datajson)) !== null) {
            resulthref.push(match2); 
        }
    });

    const uniqueTitles = new Set();
    const dataFractions = []; 

    resulthref.forEach((fraction, index) => {
        const title = fraction[2]; 
        const video = fraction[1]; 

        if (!uniqueTitles.has(title)) {
            uniqueTitles.add(title); 
            const image = resultImages[index] || null;
            const dates = allDates[index] || null;
            const dataFraction = {
                title: title,
                video: hostname + '/' + 'vid?=' + video,
                image: image,
                uploaded: dates,
            };
            dataFractions.push(dataFraction); 
        }
    });

    res.status(200).json({ data: dataFractions });
};
