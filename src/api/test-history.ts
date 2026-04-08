import api from '../client';

async function test() {
    try {
        const res = await api.get('past-history/questions');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
