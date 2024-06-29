module.exports = {
    getCredentails: function getCredentails(){
        let configuration = {
            appname: 'demo',
            username: '******',
            password: '******',
            url: 'https://mydomain.com',
            tabulaini: 'tabula.ini',
            language: 1,
            profile: {
                company: 'demo',
            },
            devicename: 'Roy',
            appid: '*****',
            appkey: '*****'

        };
        return {'credentials' : configuration};
    }
}