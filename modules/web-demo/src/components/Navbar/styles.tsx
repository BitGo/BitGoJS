import styled from 'styled-components';

export const NavbarContainer = styled.div`
  width: 150px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-right: 1px solid #e0e0e0;
  padding: 16px 0;
  overflow: hidden;
`;

export const NavItem = styled.div<{ activeRoute: boolean }>`
  padding: 16px 0;
  padding-left: 16px;
  width: 100%;
  cursor: pointer;

  ${(p) =>
    p.activeRoute &&
    `
    color: #2e8ff0;
    background: #e2f1fb;
  `}
  :hover {
    transform: scale(1.05, 1.05);
    outline: 1px solid #2e8ff0;
  }
`;
