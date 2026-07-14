import React, { useRef, useState, useEffect } from 'react';

interface CodeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ value, onChange, disabled = false }) => {
    const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Синхронизация с внешним значением (например, при очистке формы)
    useEffect(() => {
        const codeStr = value || '';
        const newDigits = Array(6).fill('');
        for (let i = 0; i < Math.min(codeStr.length, 6); i++) {
            if (/[0-9]/.test(codeStr[i])) {
                newDigits[i] = codeStr[i];
            }
        }
        setDigits(newDigits);
    }, [value]);

    const focusInput = (index: number) => {
        if (index >= 0 && index < 6) {
            inputRefs.current[index]?.focus();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        // Нам нужна только последняя введенная цифра (на случай, если автозаполнение вставило больше)
        const digit = val.replace(/\D/g, '').slice(-1);

        const newDigits = [...digits];
        newDigits[index] = digit;
        setDigits(newDigits);

        const newCode = newDigits.join('');
        onChange(newCode);

        // Перемещаем фокус вперед, если ввели цифру
        if (digit !== '') {
            if (index < 5) {
                focusInput(index + 1);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newDigits = [...digits];

            if (digits[index] !== '') {
                // Если текущая ячейка заполнена, очищаем её
                newDigits[index] = '';
                setDigits(newDigits);
                onChange(newDigits.join(''));
            } else if (index > 0) {
                // Если текущая ячейка пустая, очищаем предыдущую и переносим фокус
                newDigits[index - 1] = '';
                setDigits(newDigits);
                onChange(newDigits.join(''));
                focusInput(index - 1);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            focusInput(index - 1);
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            focusInput(index + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (disabled) return;

        const pasteData = e.clipboardData.getData('text');
        // Оставляем только первые 6 цифр
        const numbers = pasteData.replace(/\D/g, '').slice(0, 6);
        
        if (numbers.length === 0) return;

        const newDigits = Array(6).fill('');
        for (let i = 0; i < numbers.length; i++) {
            newDigits[i] = numbers[i];
        }
        setDigits(newDigits);
        
        const newCode = newDigits.join('');
        onChange(newCode);

        // Фокусируемся на последней заполненной ячейке или на следующей пустой
        const targetIndex = Math.min(numbers.length, 5);
        focusInput(targetIndex);
    };

    return (
        <div className="otp-container">
            {digits.map((digit, index) => (
                <React.Fragment key={index}>
                    <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        disabled={disabled}
                        className="otp-input"
                        placeholder="•"
                    />
                    {index === 2 && <span className="otp-separator">—</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CodeInput;
