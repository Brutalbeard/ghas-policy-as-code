import { fetchSecretScanningAlerts, fetchCustomizationOptions, checkAlertsExceedLimit, postPrComment, main } from '../src/main';
import axios from 'axios';
import * as yaml from 'js-yaml';
import { jest } from '@jest/globals';

describe('TestSecretScanningAction', () => {

    test('fetchSecretScanningAlerts', async () => {
        const mockResponse = {
            data: [{ id: 1, secret: 'secret1', severity: 'high', created_at: '2022-01-01T00:00:00Z' }]
        };
        jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

        const repo = 'test/repo';
        const token = 'test_token';
        const alerts = await fetchSecretScanningAlerts(repo, token);

        expect(alerts.length).toBe(1);
        expect(alerts[0].secret).toBe('secret1');
    });

    test('fetchCustomizationOptions', async () => {
        const mockResponse = {
            data: `
secret-scanning:
    low: 30
    medium: 14
    high: 7
    critical: 3
`
        };
        jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

        const configRepo = 'test/config_repo';
        const configPath = 'config.yaml';
        const token = 'test_token';
        const options = await fetchCustomizationOptions(configRepo, configPath, token);

        expect(options['secret-scanning'].high).toBe(7);
        expect(options['secret-scanning'].medium).toBe(14);
        expect(options['secret-scanning'].low).toBe(30);
        expect(options['secret-scanning'].critical).toBe(3);
    });

    test('checkAlertsExceedLimit', () => {
        const alerts = [
            { id: 1, secret: 'secret1', severity: 'high', created_at: '2022-01-01T00:00:00Z' },
            { id: 2, secret: 'secret2', severity: 'medium', created_at: '2022-01-02T00:00:00Z' }
        ];
        const options = { 'secret-scanning': { high: 7, medium: 14, low: 30, critical: 3 } };

        expect(checkAlertsExceedLimit(alerts, options)).toBe(true);
    });

    test('postPrComment', async () => {
        const mockResponse = {};
        jest.spyOn(axios, 'post').mockResolvedValue(mockResponse);

        const repo = 'test/repo';
        const prNumber = 1;
        const token = 'test_token';
        const alerts = [{ id: 1, secret: 'secret1', severity: 'high', created_at: '2022-01-01T00:00:00Z' }];

        await postPrComment(repo, prNumber, token, alerts);

        expect(axios.post).toHaveBeenCalled();
    });

    test('main', async () => {
        jest.spyOn(global, 'fetchSecretScanningAlerts').mockResolvedValue([{ id: 1, secret: 'secret1', severity: 'high', created_at: '2022-01-01T00:00:00Z' }]);
        jest.spyOn(global, 'fetchCustomizationOptions').mockResolvedValue({ 'secret-scanning': { high: 7, medium: 14, low: 30, critical: 3 } });
        jest.spyOn(global, 'checkAlertsExceedLimit').mockReturnValue(true);
        jest.spyOn(global, 'postPrComment').mockResolvedValue({});

        await expect(main()).rejects.toThrow("PR blocked due to secret scanning alerts exceeding allowed limit.");

        expect(global.postPrComment).toHaveBeenCalled();
    });

});
