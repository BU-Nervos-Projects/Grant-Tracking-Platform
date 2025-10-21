import { config } from '@/configs/config'


async function main() {
    if (!config.serviceBotToken) {
        console.error('[risk-scan] Missing SERVICE_BOT_TOKEN in .env')
        process.exit(1)
    }

    const url = `${config.backendUrl}/api/cron/risk-scan`
    console.log(`[risk-scan] Hitting: ${url} @ ${new Date().toISOString()}`)

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.serviceBotToken}`,
                'Content-Type': 'application/json',
            },
        })

        const text = await res.text().catch(() => '')
        console.log(`[risk-scan] Status: ${res.status}`)
        if (text) console.log(`[risk-scan] Body: ${text}`)

        if (!res.ok) process.exit(2)
        process.exit(0)
    } catch (err) {
        console.error('[risk-scan] Error:', err)
        process.exit(3)
    }
}

main()
