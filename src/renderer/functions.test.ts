import { describe, test, expect } from '@jest/globals';
import { formatTime, processNumberInput, convertStackToTime, calculateProgressRatio } from './functions';

// formatTime のテスト
describe('formatTime', () => {
    test('0秒を正しくフォーマットする', () => {
        expect(formatTime(0)).toBe('00:00');
    });

    test('59秒を正しくフォーマットする', () => {
        expect(formatTime(59)).toBe('00:59');
    });

    test('1分を正しくフォーマットする', () => {
        expect(formatTime(60)).toBe('01:00');
    });

    test('1分1秒を正しくフォーマットする', () => {
        expect(formatTime(61)).toBe('01:01');
    });

    test('10分を正しくフォーマットする', () => {
        expect(formatTime(600)).toBe('10:00');
    });

    test('59分59秒を正しくフォーマットする', () => {
        expect(formatTime(3599)).toBe('59:59');
    });
});

// processNumberInput のテスト
describe('processNumberInput', () => {
    describe('初期状態からの入力', () => {
        test.each([
            { input: "0000", digit: 1, expected: "0001" },
            { input: "0000", digit: 5, expected: "0005" },
            { input: "0000", digit: 9, expected: "0009" },
            { input: "0000", digit: 0, expected: "0000" },
        ])('$input に $digit を入力すると $expected になる', ({ input, digit, expected }) => {
            expect(processNumberInput(input, digit)).toBe(expected);
        });
    });

    describe('連続入力（右からpush）', () => {
        test.each([
            { input: "0001", digit: 2, expected: "0012" },
            { input: "0012", digit: 3, expected: "0123" },
            { input: "0123", digit: 4, expected: "1234" },
            { input: "0005", digit: 9, expected: "0059" },
        ])('$input に $digit を入力すると $expected になる', ({ input, digit, expected }) => {
            expect(processNumberInput(input, digit)).toBe(expected);
        });
    });

    describe('4桁入力後の自動リセット', () => {
        test.each([
            { input: "1234", digit: 5, expected: "0005" },
            { input: "5959", digit: 0, expected: "0000" },
            { input: "9999", digit: 1, expected: "0001" },
            { input: "1000", digit: 2, expected: "0002" },
        ])('$input に $digit を入力すると $expected になる', ({ input, digit, expected }) => {
            expect(processNumberInput(input, digit)).toBe(expected);
        });
    });

    describe('先頭が0の4桁（まだフルではない）', () => {
        test.each([
            { input: "0123", digit: 4, expected: "1234" },
            { input: "0012", digit: 3, expected: "0123" },
            { input: "0001", digit: 2, expected: "0012" },
            { input: "0999", digit: 8, expected: "9998" },
        ])('$input に $digit を入力すると $expected になる', ({ input, digit, expected }) => {
            expect(processNumberInput(input, digit)).toBe(expected);
        });
    });
});

// convertStackToTime のテスト
describe('convertStackToTime', () => {
    describe('通常の変換', () => {
        test.each([
            { stack: "0001", expected: { minutes: 0, seconds: 1 } },
            { stack: "1234", expected: { minutes: 12, seconds: 34 } },
            { stack: "0530", expected: { minutes: 5, seconds: 30 } },
            { stack: "5959", expected: { minutes: 59, seconds: 59 } },
            { stack: "0000", expected: { minutes: 0, seconds: 0 } },
        ])('$stack → $expected.minutes:$expected.seconds', ({ stack, expected }) => {
            expect(convertStackToTime(stack)).toEqual(expected);
        });
    });

    describe('60秒制限', () => {
        test.each([
            { stack: "1260", expected: { minutes: 12, seconds: 59 } },
            { stack: "0099", expected: { minutes: 0, seconds: 59 } },
            { stack: "0660", expected: { minutes: 6, seconds: 59 } },
            { stack: "5960", expected: { minutes: 59, seconds: 59 } },
            { stack: "0061", expected: { minutes: 0, seconds: 59 } },
            { stack: "9999", expected: { minutes: 59, seconds: 59 } },
        ])('$stack → $expected.minutes:$expected.seconds (60秒制限)', ({ stack, expected }) => {
            expect(convertStackToTime(stack)).toEqual(expected);
        });
    });

    describe('60分制限', () => {
        test.each([
            { stack: "6034", expected: { minutes: 59, seconds: 34 } },
            { stack: "9900", expected: { minutes: 59, seconds: 0 } },
            { stack: "7559", expected: { minutes: 59, seconds: 59 } },
            { stack: "6000", expected: { minutes: 59, seconds: 0 } },
        ])('$stack → $expected.minutes:$expected.seconds (60分制限)', ({ stack, expected }) => {
            expect(convertStackToTime(stack)).toEqual(expected);
        });
    });

    describe('分秒両方の制限', () => {
        test.each([
            { stack: "6161", expected: { minutes: 59, seconds: 59 } },
            { stack: "9999", expected: { minutes: 59, seconds: 59 } },
            { stack: "6075", expected: { minutes: 59, seconds: 59 } },
            { stack: "8888", expected: { minutes: 59, seconds: 59 } },
        ])('$stack → $expected.minutes:$expected.seconds (両方制限)', ({ stack, expected }) => {
            expect(convertStackToTime(stack)).toEqual(expected);
        });
    });
});

// ユーザーシナリオに基づく動作確認（各テストは独立）
describe('ユーザーシナリオ', () => {
    test('Scenario: 1,2,3,4と順に入力', () => {
        let stack = "0000";
        stack = processNumberInput(stack, 1);
        expect(stack).toBe("0001");
        expect(convertStackToTime(stack)).toEqual({ minutes: 0, seconds: 1 });
        
        stack = processNumberInput(stack, 2);
        expect(stack).toBe("0012");
        expect(convertStackToTime(stack)).toEqual({ minutes: 0, seconds: 12 });
        
        stack = processNumberInput(stack, 3);
        expect(stack).toBe("0123");
        expect(convertStackToTime(stack)).toEqual({ minutes: 1, seconds: 23 });
        
        stack = processNumberInput(stack, 4);
        expect(stack).toBe("1234");
        expect(convertStackToTime(stack)).toEqual({ minutes: 12, seconds: 34 });
    });

    test('Scenario: 60秒制限のケース', () => {
        let stack = "0126";
        stack = processNumberInput(stack, 0);
        expect(stack).toBe("1260");
        expect(convertStackToTime(stack)).toEqual({ minutes: 12, seconds: 59 });
    });

    test('Scenario: 4桁後のリセット', () => {
        let stack = "5959";
        stack = processNumberInput(stack, 7);
        expect(stack).toBe("0007");
        expect(convertStackToTime(stack)).toEqual({ minutes: 0, seconds: 7 });
    });

    test('Scenario: Issue #10の仕様確認', () => {
        // 入力値スタック変換表の確認
        expect(convertStackToTime("0001")).toEqual({ minutes: 0, seconds: 1 });
        expect(convertStackToTime("1234")).toEqual({ minutes: 12, seconds: 34 });
        expect(convertStackToTime("1260")).toEqual({ minutes: 12, seconds: 59 });
        expect(convertStackToTime("0660")).toEqual({ minutes: 6, seconds: 59 });
        expect(convertStackToTime("6034")).toEqual({ minutes: 59, seconds: 34 });
        expect(convertStackToTime("6161")).toEqual({ minutes: 59, seconds: 59 });
    });
});

// calculateProgressRatio のテスト
describe('calculateProgressRatio', () => {
    test('未開始状態: totalSeconds = 0', () => {
        expect(calculateProgressRatio(0, 0)).toBe(1);
    });

    test('未開始状態: totalSeconds < 0', () => {
        expect(calculateProgressRatio(-1, 0)).toBe(1);
    });

    test('開始直後: progress = 0%', () => {
        expect(calculateProgressRatio(180, 180)).toBe(1);
    });

    test('25%完了', () => {
        expect(calculateProgressRatio(100, 75)).toBeCloseTo(0.75);
    });

    test('50%完了', () => {
        expect(calculateProgressRatio(100, 50)).toBeCloseTo(0.5);
    });

    test('75%完了', () => {
        expect(calculateProgressRatio(100, 25)).toBeCloseTo(0.25);
    });

    test('完了状態: timeLeft = 0', () => {
        expect(calculateProgressRatio(180, 0)).toBe(0);
    });

    test('境界値テスト', () => {
        // 1秒タイマー
        expect(calculateProgressRatio(1, 1)).toBe(1);
        expect(calculateProgressRatio(1, 0)).toBe(0);
        
        // 1時間タイマー
        expect(calculateProgressRatio(3600, 1800)).toBeCloseTo(0.5);
    });

    test('進捗比率の計算確認', () => {
        // 10秒タイマー
        expect(calculateProgressRatio(10, 10)).toBe(1.0); // 0%完了 = 100%オフセット
        expect(calculateProgressRatio(10, 8)).toBeCloseTo(0.8);  // 20%完了 = 80%オフセット
        expect(calculateProgressRatio(10, 5)).toBeCloseTo(0.5);  // 50%完了 = 50%オフセット
        expect(calculateProgressRatio(10, 2)).toBeCloseTo(0.2);  // 80%完了 = 20%オフセット
        expect(calculateProgressRatio(10, 0)).toBe(0.0);  // 100%完了 = 0%オフセット
    });

    test('実際のタイマー値での確認', () => {
        // 3分タイマー（180秒）
        expect(calculateProgressRatio(180, 180)).toBe(1.0); // 未開始
        expect(calculateProgressRatio(180, 135)).toBe(0.75); // 25%完了
        expect(calculateProgressRatio(180, 90)).toBe(0.5);  // 50%完了
        expect(calculateProgressRatio(180, 45)).toBe(0.25); // 75%完了
        expect(calculateProgressRatio(180, 0)).toBe(0.0);   // 完了
    });
});