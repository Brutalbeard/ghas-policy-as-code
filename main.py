import requests
import yaml
from datetime import datetime, timedelta

def fetch_secret_scanning_alerts(repo, token):
    url = f"https://api.github.com/repos/{repo}/secret-scanning/alerts"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def fetch_customization_options(config_repo, config_path, token):
    url = f"https://api.github.com/repos/{config_repo}/contents/{config_path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3.raw"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return yaml.safe_load(response.text)

def check_alerts_exceed_limit(alerts, options):
    now = datetime.now()
    for alert in alerts:
        created_at = datetime.strptime(alert['created_at'], "%Y-%m-%dT%H:%M:%SZ")
        severity = alert['severity']
        
        # Access the nested configuration structure
        if 'secret-scanning' in options and severity in options['secret-scanning']:
            allowed_duration = timedelta(days=options['secret-scanning'][severity])
            if now - created_at > allowed_duration:
                return True
        else:
            # Default behavior if configuration is missing
            print(f"Warning: Missing configuration for severity level '{severity}'")
    return False

def post_pr_comment(repo, pr_number, token, alerts):
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    comment_body = "## Secret Scanning Alerts\n\n"
    comment_body += "| Alert | Severity | Created At |\n"
    comment_body += "|-------|----------|------------|\n"
    for alert in alerts[:20]:
        comment_body += f"| {alert['secret']} | {alert['severity']} | {alert['created_at']} |\n"
    if len(alerts) > 20:
        comment_body += f"\n...and {len(alerts) - 20} more alerts.\n"
    data = {"body": comment_body}
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()

def main():
    import os
    repo = os.getenv("GITHUB_REPOSITORY")
    token = os.getenv("GITHUB_TOKEN")
    config_repo = os.getenv("CONFIG_REPO")
    config_path = os.getenv("CONFIG_PATH")
    pr_number = os.getenv("PR_NUMBER")

    alerts = fetch_secret_scanning_alerts(repo, token)
    options = fetch_customization_options(config_repo, config_path, token)

    if check_alerts_exceed_limit(alerts, options):
        post_pr_comment(repo, pr_number, token, alerts)
        raise Exception("PR blocked due to secret scanning alerts exceeding allowed limit.")

if __name__ == "__main__":
    main()
