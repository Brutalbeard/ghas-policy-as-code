import unittest
from unittest.mock import patch, MagicMock
from main import fetch_secret_scanning_alerts, fetch_customization_options, check_alerts_exceed_limit, post_pr_comment, main

class TestSecretScanningAction(unittest.TestCase):

    @patch('main.requests.get')
    def test_fetch_secret_scanning_alerts(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = [{'id': 1, 'secret': 'secret1', 'severity': 'high', 'created_at': '2022-01-01T00:00:00Z'}]
        mock_get.return_value = mock_response

        repo = 'test/repo'
        token = 'test_token'
        alerts = fetch_secret_scanning_alerts(repo, token)

        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]['secret'], 'secret1')

    @patch('main.requests.get')
    def test_fetch_customization_options(self, mock_get):
        mock_response = MagicMock()
        mock_response.text = 'high: 1\nmedium: 3\nlow: 7\n'
        mock_get.return_value = mock_response

        config_repo = 'test/config_repo'
        config_path = 'config.yaml'
        token = 'test_token'
        options = fetch_customization_options(config_repo, config_path, token)

        self.assertEqual(options['high'], 1)
        self.assertEqual(options['medium'], 3)
        self.assertEqual(options['low'], 7)

    def test_check_alerts_exceed_limit(self):
        alerts = [
            {'id': 1, 'secret': 'secret1', 'severity': 'high', 'created_at': '2022-01-01T00:00:00Z'},
            {'id': 2, 'secret': 'secret2', 'severity': 'medium', 'created_at': '2022-01-02T00:00:00Z'}
        ]
        options = {'high': 1, 'medium': 3, 'low': 7}

        self.assertTrue(check_alerts_exceed_limit(alerts, options))

    @patch('main.requests.post')
    def test_post_pr_comment(self, mock_post):
        mock_response = MagicMock()
        mock_post.return_value = mock_response

        repo = 'test/repo'
        pr_number = 1
        token = 'test_token'
        alerts = [{'id': 1, 'secret': 'secret1', 'severity': 'high', 'created_at': '2022-01-01T00:00:00Z'}]

        post_pr_comment(repo, pr_number, token, alerts)

        self.assertTrue(mock_post.called)

    @patch('main.fetch_secret_scanning_alerts')
    @patch('main.fetch_customization_options')
    @patch('main.check_alerts_exceed_limit')
    @patch('main.post_pr_comment')
    def test_main(self, mock_post_pr_comment, mock_check_alerts_exceed_limit, mock_fetch_customization_options, mock_fetch_secret_scanning_alerts):
        mock_fetch_secret_scanning_alerts.return_value = [{'id': 1, 'secret': 'secret1', 'severity': 'high', 'created_at': '2022-01-01T00:00:00Z'}]
        mock_fetch_customization_options.return_value = {'high': 1, 'medium': 3, 'low': 7}
        mock_check_alerts_exceed_limit.return_value = True

        with self.assertRaises(Exception) as context:
            main()

        self.assertTrue(mock_post_pr_comment.called)
        self.assertEqual(str(context.exception), "PR blocked due to secret scanning alerts exceeding allowed limit.")

if __name__ == '__main__':
    unittest.main()
