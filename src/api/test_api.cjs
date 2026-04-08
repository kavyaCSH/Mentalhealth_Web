const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('https://mental-health-api-rke4.onrender.com/api/v1/past-history/questions', {
            headers: {
                'x-api-key': 'ygXk1R15vil+RD9Ix5c4cUPqND5i7+M3NRsEmxByDL8='
            }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Failed.', e.message);
    }
}
test();
