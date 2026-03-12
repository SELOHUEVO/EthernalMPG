

import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { db } from '../../services/database';
import { Button } from '../../components/FormElements';
import './TwoFactorPage.css';

interface TwoFactorPageProps {
  user: User;
  onVerified: (user: User) => void;
  onCancel: () => void;
}

export function TwoFactorPage({ user, onVerified, onCancel }: TwoFactorPageProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [useBackup]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(d => d !== '') && index === 5) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || (useBackup ? backupCode : code.join(''));
    
    if (useBackup) {
      if (finalCode.length < 6) {
        setError('Введите код восстановления');
        return;
      }
    } else {
      if (finalCode.length !== 6) {
        setError('Введите полный 6-значный код');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let verified = false;
      if (useBackup) {
        verified = await db.verifyBackupCode(user.id, finalCode);
      } else {
        verified = await db.verifyTwoFactorCode(user.id, finalCode);
      }

      if (verified) {
        onVerified(user);
      } else {
        setError('Неверный код. Попробуйте снова.');
        setCode(['', '', '', '', '', '']);
        setBackupCode('');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    const newCode = await db.createTwoFactorSession(user.id);
    setResendCooldown(30);
    console.log('New 2FA Code:', newCode);
  };

  return (
    <div className="twofa-page">
      <div className="twofa-card">
        <div className="twofa-header">
          <div className="twofa-icon">🔐</div>
          <h1 className="twofa-title">Двухфакторная аутентификация</h1>
          <p className="twofa-subtitle">
            Введите код подтверждения для входа в аккаунт <strong>{user.username}</strong>
          </p>
        </div>

        {!useBackup ? (
          <div className="twofa-code-section">
            <label className="twofa-label">6-значный код подтверждения</label>
            <div className="code-inputs" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`code-input ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={e => handleCodeChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  disabled={loading}
                />
              ))}
            </div>
            <p className="code-hint">
              Код был отправлен на вашу почту. Введите его для подтверждения.
            </p>

            <button
              className="resend-btn"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Отправить повторно через ${resendCooldown}с`
                : '🔄 Отправить код повторно'}
            </button>
          </div>
        ) : (
          <div className="twofa-backup-section">
            <label className="twofa-label">Код восстановления</label>
            <input
              type="text"
              className="backup-input"
              value={backupCode}
              onChange={e => setBackupCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              disabled={loading}
              autoFocus
            />
            <p className="code-hint">
              Введите один из ваших резервных кодов восстановления
            </p>
          </div>
        )}

        {error && <div className="twofa-error">{error}</div>}

        <div className="twofa-actions">
          {!useBackup ? (
            <button className="switch-mode-btn" onClick={() => setUseBackup(true)}>
              🔑 Использовать код восстановления
            </button>
          ) : (
            <button className="switch-mode-btn" onClick={() => { setUseBackup(false); setBackupCode(''); setError(''); }}>
              📱 Использовать код подтверждения
            </button>
          )}
        </div>

        <div className="twofa-footer">
          <button className="cancel-btn" onClick={onCancel}>
            ← Вернуться к входу
          </button>
        </div>

        <div className="twofa-security-note">
          <span className="security-icon">🛡️</span>
          <span>Эта дополнительная защита помогает сохранить ваш аккаунт в безопасности</span>
        </div>
      </div>
    </div>
  );
}

