const priority = require('priority-web-sdk');

async function webSDK() {

    let config={
        url:'https://p.priority-connect.online/wcf/service.svc',
            tabulaini:'tabbdc3d.ini',
                language: 3,
                profile: {
                    company: 'isr',
                },
                appname:'demo',
                username:'API',
                    password: 'Aa123456',
                        devicename:'',
                        appid: '',
                        appkey: ''
                        };
                        try {
                            await priority.login(config)
                            console.log('Your are in!! Enjoy!')
                        }
                        catch(reason){
                            console.error(reason.message)
                        }
                        };

(async () => {
    await webSDK(); // calls your webSDK function
})();
