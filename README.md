# Secret Scanning Alert Action

This GitHub Action checks for secret scanning alerts in the repository and blocks pull requests if necessary. It uses the GitHub REST API to fetch secret scanning alerts and a YAML file for customization options.

## Usage

To use this action, create a workflow file (e.g., `.github/workflows/secret-scanning-action.yml`) in your repository with the following content:

```yaml
name: Secret Scanning Action

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  secret-scanning:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v2

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'

    - name: Install dependencies
      run: |
        npm install

    - name: Run secret scanning action
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        CONFIG_REPO: ${{ secrets.CONFIG_REPO }}
        CONFIG_PATH: ${{ secrets.CONFIG_PATH }}
        PR_NUMBER: ${{ github.event.pull_request.number }}
      run: node src/main.js
```

## Configuration

The action requires a YAML file for customization options. The YAML file should be maintained in a separate repository and should contain the following structure:

```yaml
secret-scanning:
    low: 30      # Number of days a low severity alert can be open
    medium: 14   # Number of days a medium severity alert can be open
    high: 7      # Number of days a high severity alert can be open
    critical: 3  # Number of days a critical severity alert can be open
```

Each key under `secret-scanning` represents a severity level of the alerts, and the value represents the number of days an alert of that severity level can be open before it must be addressed.

## Inputs

- `github_token`: GitHub token to access the repository (required)
- `config_repo`: Repository containing the customization options YAML file (required)
- `config_path`: Path to the customization options YAML file (required)

## Example

Here is an example of how to configure the action in your workflow file:

```yaml
name: Secret Scanning Action

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  secret-scanning:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v2

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'

    - name: Install dependencies
      run: |
        npm install

    - name: Run secret scanning action
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        CONFIG_REPO: ${{ secrets.CONFIG_REPO }}
        CONFIG_PATH: ${{ secrets.CONFIG_PATH }}
        PR_NUMBER: ${{ github.event.pull_request.number }}
      run: node src/main.js
```

## License

This project is licensed under the MIT License.
