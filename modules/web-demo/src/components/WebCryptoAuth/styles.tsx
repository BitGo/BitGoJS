import styled from 'styled-components';

export const PageContainer = styled.div`
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
`;

export const TwoColumnLayout = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
`;

export const LeftColumn = styled.div`
  flex: 1;
  min-width: 0;
  max-width: 520px;
`;

export const RightColumn = styled.div`
  flex: 1;
  min-width: 0;
  position: sticky;
  top: 0;
`;

export const Section = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
`;

export const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  color: #333;
`;

export const FormGroup = styled.div`
  margin-bottom: 12px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2e8ff0;
    box-shadow: 0 0 0 2px rgba(46, 143, 240, 0.2);
  }
`;

export const Button = styled.button<{ variant?: 'danger' | 'secondary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 8px;

  background: ${(p) =>
    p.variant === 'danger'
      ? '#dc3545'
      : p.variant === 'secondary'
      ? '#6c757d'
      : '#2e8ff0'};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const StatusBadge = styled.span<{ active: boolean }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => (p.active ? '#d4edda' : '#f8d7da')};
  color: ${(p) => (p.active ? '#155724' : '#721c24')};
`;

export const LogArea = styled.pre`
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
`;

export const ErrorText = styled.div`
  color: #dc3545;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8d7da;
  border-radius: 4px;
`;

export const SuccessText = styled.div`
  color: #155724;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px;
  background: #d4edda;
  border-radius: 4px;
`;
