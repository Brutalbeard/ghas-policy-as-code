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

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.x'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install poetry
        poetry install

    - name: Run secret scanning action
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        CONFIG_REPO: ${{ secrets.CONFIG_REPO }}
        CONFIG_PATH: ${{ secrets.CONFIG_PATH }}
        PR_NUMBER: ${{ github.event.pull_request.number }}
      run: python main.py
```

## Configuration

The action requires a YAML file for customization options. The YAML file should be maintained in a separate repository and should contain the following structure:

```yaml
low: 7
medium: 3
high: 1
```

Each key represents the severity level of the alerts, and the value represents the number of days an alert of that severity level can be open before it must be addressed.

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

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.x'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install poetry
        poetry install

    - name: Run secret scanning action
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        CONFIG_REPO: ${{ secrets.CONFIG_REPO }}
        CONFIG_PATH: ${{ secrets.CONFIG_PATH }}
        PR_NUMBER: ${{ github.event.pull_request.number }}
      run: python main.py
```

## License

This project is licensed under the MIT License.
