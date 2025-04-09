import axios from 'axios';
import * as yaml from 'js-yaml';
import { DateTime } from 'luxon';

async function fetchSecretScanningAlerts(repo: string, token: string) {
    const url = `https://api.github.com/repos/${repo}/secret-scanning/alerts`;
    const headers = {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
    };
    const response = await axios.get(url, { headers });
    return response.data;
}

async function fetchCustomizationOptions(configRepo: string, configPath: string, token: string) {
    const url = `https://api.github.com/repos/${configRepo}/contents/${configPath}`;
    const headers = {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3.raw"
    };
    const response = await axios.get(url, { headers });
    return yaml.load(response.data);
}

function checkAlertsExceedLimit(alerts: any[], options: any) {
    const now = DateTime.now();
    for (const alert of alerts) {
        const createdAt = DateTime.fromISO(alert.created_at);
        const severity = alert.severity;

        if (options['secret-scanning'] && options['secret-scanning'][severity]) {
            const allowedDuration = options['secret-scanning'][severity];
            if (now.diff(createdAt, 'days').days > allowedDuration) {
                return true;
            }
        } else {
            console.warn(`Warning: Missing configuration for severity level '${severity}'`);
        }
    }
    return false;
}

async function postPrComment(repo: string, prNumber: number, token: string, alerts: any[]) {
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
