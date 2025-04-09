const axios = require('axios');
const yaml = require('js-yaml');

async function fetchSecretScanningAlerts(repo, token) {
    const url = `https://api.github.com/repos/${repo}/secret-scanning/alerts`;
    const headers = {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
    };
    const response = await axios.get(url, { headers });
    if (!response || !response.data) {
        throw new Error("Failed to fetch secret scanning alerts: Response data is undefined");
    }
    return response.data;
}

async function fetchCustomizationOptions(configRepo, configPath, token) {
    const url = `https://api.github.com/repos/${configRepo}/contents/${configPath}`;
    const headers = {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3.raw"
    };
    const response = await axios.get(url, { headers });
    return yaml.load(response.data);
}

function checkAlertsExceedLimit(alerts, options) {
    const now = new Date();
    for (const alert of alerts) {
        const createdAt = new Date(alert.created_at);
        const severity = alert.severity;

        if (options['secret-scanning'] && options['secret-scanning'][severity]) {
            const allowedDuration = options['secret-scanning'][severity];
            const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
            if (daysDifference > allowedDuration) {
                return true;
            }
        } else {
            console.warn(`Warning: Missing configuration for severity level '${severity}'`);
        }
    }
    return false;
}

async function postPrComment(repo, prNumber, token, alerts) {
    const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
    const headers = {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
    };
    let commentBody = "## Secret Scanning Alerts\n\n";
    commentBody += "| Alert | Severity | Created At |\n";
    commentBody += "|-------|----------|------------|\n";
    for (const alert of alerts.slice(0, 20)) {
        commentBody += `| ${alert.secret} | ${alert.severity} | ${alert.created_at} |\n`;
    }
    if (alerts.length > 20) {
        commentBody += `\n...and ${alerts.length - 20} more alerts.\n`;
    }
    const data = { body: commentBody };
    await axios.post(url, data, { headers });
}

async function main() {
    const repo = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    const configRepo = process.env.CONFIG_REPO;
    const configPath = process.env.CONFIG_PATH;
    const prNumber = parseInt(process.env.PR_NUMBER, 10);

    const alerts = await fetchSecretScanningAlerts(repo, token);
    const options = await fetchCustomizationOptions(configRepo, configPath, token);

    if (checkAlertsExceedLimit(alerts, options)) {
        await postPrComment(repo, prNumber, token, alerts);
        throw new Error("PR blocked due to secret scanning alerts exceeding allowed limit.");
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
