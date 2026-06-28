import axios from 'axios';
import crypto from 'crypto';

// Default constants
const DEFAULT_PANEL_URL = 'http://216.106.191.213:7275';
const DEFAULT_WEB_BASE_PATH = '/znuwjha'; 
const DEFAULT_API_TOKEN = 'bM41sxxSuvXHexMz4EVj4i1m6xui7ZxtjJuddtz81mCyXdgY';
const DEFAULT_INBOUND_ID = 1;

// Dynamic client creation
export function getApiClient(server?: any) {
    const url = server?.panelUrl || DEFAULT_PANEL_URL;
    const path = server?.webBasePath !== undefined ? server.webBasePath : DEFAULT_WEB_BASE_PATH;
    const token = server?.apiToken || DEFAULT_API_TOKEN;

    return axios.create({
        baseURL: `${url}${path}/`,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        timeout: 10000 
    });
}

const BITPIN_API = 'https://api.bitpin.org/api/v1/mkt/tickers/';

let cachedUsdtPrice: number | null = null;
let lastFetchTime = 0;

export async function getUsdtRate() {
    const now = Date.now();
    if (cachedUsdtPrice !== null && (now - lastFetchTime) < 30000) {
        return cachedUsdtPrice;
    }
    try {
        const res = await axios.get(BITPIN_API, { timeout: 8000 });
        if (res.data && Array.isArray(res.data)) {
            const usdt = res.data.find(ticker => ticker.symbol === 'USDT_IRT');
            if (usdt && usdt.price) {
                cachedUsdtPrice = Math.ceil(Number(usdt.price));
                lastFetchTime = now;
                return cachedUsdtPrice;
            }
        }
    } catch (error: any) {
        console.error('⚠️ [USDT] خطا در دریافت قیمت از بیت‌پین:', error.message);
    }
    return cachedUsdtPrice;
}

export async function testServerConnection(panelUrl: string, webBasePath: string, apiToken: string) {
    try {
        const client = axios.create({
            baseURL: `${panelUrl}${webBasePath}/`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        const res = await client.get('panel/api/inbounds/list');
        if (res.data && res.data.success) {
            return { success: true, msg: 'اتصال موفقیت‌آمیز بود' };
        }
        return { success: false, msg: res.data?.msg || 'سرور خطا داد' };
    } catch (error: any) {
        return { success: false, msg: error.message };
    }
}

export async function createClient(email: string, totalGB: number, expiryDays: number, server: any = null) {
    const expiryTime = expiryDays > 0 ? Date.now() + (expiryDays * 24 * 60 * 60 * 1000) : 0;
    const bytesTotal = Math.floor(totalGB * 1073741824);
    const uuid = crypto.randomUUID();
    const subId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    
    const inboundId = server?.inboundId || DEFAULT_INBOUND_ID;
    const apiClient = getApiClient(server);

    try {
        const res = await apiClient.post('panel/api/clients/add', {
            client: { id: uuid, email, totalGB: bytesTotal, expiryTime, enable: true, limitIp: 0, subId },
            inboundIds: [inboundId]
        });
        if (res.data && !res.data.success) {
            console.error("❌ ارور پنل موقع ساخت اکانت:", res.data.msg);
            return null;
        }
        return uuid;
    } catch (error: any) {
        console.error("❌ خطای API موقع ساخت:", error.response?.data ? JSON.stringify(error.response.data) : error.message);
        return null;
    }
}

export async function deleteClient(email: string, server: any = null) {
    const apiClient = getApiClient(server);
    try {
        await apiClient.post(`panel/api/clients/del/${email}?keepTraffic=0`);
        return true;
    } catch (error) {
        return false;
    }
}

export async function getClientTraffic(email: string, server: any = null) {
    const apiClient = getApiClient(server);
    try {
        const clientRes = await apiClient.get(`panel/api/clients/get/${encodeURIComponent(email)}`);
        let total = 0, expiryTime = 0;
        
        if (clientRes.data && clientRes.data.success && clientRes.data.obj) {
            const obj = clientRes.data.obj;
            total = obj.totalGB || obj.total || (obj.client && (obj.client.total || obj.client.totalGB)) || 0;
            expiryTime = obj.expiryTime || (obj.client && obj.client.expiryTime) || 0;
        } else {
            return null; 
        }

        let up = 0, down = 0;
        let trafficFound = false;

        try {
            const trafficRes = await apiClient.get(`panel/api/inbounds/getClientTraffics/${encodeURIComponent(email)}`);
            if (trafficRes.data && trafficRes.data.success && trafficRes.data.obj) {
                const tObj = Array.isArray(trafficRes.data.obj) ? trafficRes.data.obj[0] : trafficRes.data.obj;
                if (tObj) {
                    up = tObj.up || 0;
                    down = tObj.down || 0;
                    if (total === 0 && tObj.total) total = tObj.total;
                    trafficFound = true;
                }
            }
        } catch (trafficErr) {}

        if (!trafficFound) {
            try {
                const listRes = await apiClient.get('panel/api/inbounds/list');
                if (listRes.data && listRes.data.success && listRes.data.obj) {
                    for (const inbound of listRes.data.obj) {
                        if (inbound.clientStats) {
                            const cStats = inbound.clientStats.find((c: any) => c.email === email);
                            if (cStats) {
                                up += cStats.up || 0;
                                down += cStats.down || 0;
                                if (total === 0 && cStats.total) total = cStats.total;
                                trafficFound = true;
                            }
                        }
                    }
                }
            } catch (fallbackErr) {}
        }

        return { total, up, down, expiryTime };
    } catch (error) {
        return null;
    }
}

export async function renewClient(uuid: string, oldEmail: string, newEmail: string, finalTotalGB: number, finalExpiryDays: number, server: any = null) {
    const apiClient = getApiClient(server);
    const inboundId = server?.inboundId || DEFAULT_INBOUND_ID;

    try {
        const newTotalBytes = Math.floor(finalTotalGB * 1073741824);
        const newExpiryTime = Date.now() + (finalExpiryDays * 24 * 60 * 60 * 1000);

        try {
            await apiClient.post(`panel/api/clients/del/${encodeURIComponent(oldEmail)}?keepTraffic=0`);
        } catch (e) {
            // ignore
        }

        const subId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
        
        await apiClient.post('panel/api/clients/add', {
            client: {
                id: uuid,
                email: newEmail,
                totalGB: newTotalBytes,
                expiryTime: newExpiryTime,
                enable: true,
                limitIp: 0,
                subId: subId
            },
            inboundIds: [inboundId]
        });

        return { success: true, log: "OK" };

    } catch (error: any) {
        const errDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        return { success: false, log: errDetail };
    }
}

export function generateMciConfig(uuid: string, configName = "CypherNET💎", server: any = null) {
    const remark = encodeURIComponent(configName + " 2");
    const domain = server?.domain || "ns.crrc.ir";
    const sni = server?.sni || "css.2net.ir";
    const path = server?.path ? encodeURIComponent(server.path) : "%2FCypher_Net"; 
    
    return `vless://${uuid}@${domain}:443?encryption=none&security=tls&sni=${sni}&fp=chrome&alpn=h3%2Ch2&insecure=0&allowInsecure=0&type=xhttp&path=${path}&mode=packet-up#${remark}`;
}

export function generateMtnConfig(uuid: string, configName = "CypherNET💎", server: any = null) {
    const domain = server?.domain || "ns.crrc.ir";
    const sni = server?.sni || "css.2net.ir";
    const pathStr = server?.path ? server.path : "/Cypher_Net";

    const config = {
        "dns": {
            "servers": [
                "localhost"
            ]
        },
        "inbounds": [
            {
                "listen": "127.0.0.1",
                "port": 10808,
                "protocol": "socks",
                "settings": {
                    "auth": "noauth",
                    "udp": true,
                    "userLevel": 8
                },
                "sniffing": {
                    "destOverride": [
                        "http",
                        "tls",
                        "quic"
                    ],
                    "enabled": true,
                    "routeOnly": true
                },
                "tag": "socks"
            }
        ],
        "log": {
            "loglevel": "warning"
        },
        "outbounds": [
            {
                "mux": {
                    "concurrency": -1,
                    "enabled": false
                },
                "protocol": "vless",
                "settings": {
                    "vnext": [
                        {
                            "address": domain,
                            "port": 443,
                            "users": [
                                {
                                    "encryption": "none",
                                    "id": uuid,
                                    "level": 8
                                }
                            ]
                        }
                    ]
                },
                "streamSettings": {
                    "finalmask": { 
                        "tcp": [
                            {
                                "type": "fragment",
                                "settings": {
                                    "delay": "2-4",
                                    "length": "20-25",
                                    "packets": "tlshello"
                                }
                            }
                        ],
                        "udp": [
                            {
                                "type": "noise",
                                "settings": {
                                    "delay": "10-16",
                                    "length": "10-20"
                                }
                            }
                        ]
                    },
                    "network": "xhttp",
                    "security": "tls",
                    "sockopt": {
                        "domainStrategy": "UseIP",
                        "happyEyeballs": {
                            "interleave": 2,
                            "maxConcurrentTry": 4,
                            "prioritizeIPv6": false,
                            "tryDelayMs": 250
                        }
                    },
                    "tlsSettings": {
                        "allowInsecure": false,
                        "alpn": [
                            "h3",
                            "h2"
                        ],
                        "fingerprint": "chrome",
                        "serverName": sni
                    },
                    "xhttpSettings": {
                        "host": "",
                        "mode": "packet-up",
                        "path": pathStr
                    }
                },
                "tag": "proxy"
            },
            {
                "protocol": "freedom",
                "streamSettings": {
                    "network": "tcp",
                    "sockopt": {
                        "domainStrategy": "UseIP"
                    }
                },
                "tag": "direct"
            },
            {
                "protocol": "blackhole",
                "settings": {
                    "response": {
                        "type": "http"
                    }
                },
                "tag": "block"
            }
        ],
        "remarks": configName + " 1",
        "routing": {
            "domainStrategy": "AsIs",
            "rules": [
                {
                    "network": "udp",
                    "outboundTag": "block",
                    "port": "443",
                    "type": "field"
                },
                {
                    "port": "0-65535",
                    "outboundTag": "proxy",
                    "type": "field"
                }
            ]
        }
    };

    return JSON.stringify(config);
}
