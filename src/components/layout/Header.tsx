import { Link } from "react-router-dom";
import styled from "styled-components";
import { colors } from "../../constants/colors";
import { TitleText } from "../../constants/fonts";

const Divider = styled.div`
  margin-top: 15px;
  border-bottom: 1px solid ${colors.gray_stroke};
`;
const StyledContainer = styled.div`
  margin: 15px 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StyledLogoContainer = styled.div`
  ${TitleText}
`;

const StyledLogo = styled(Link)`
  margin-right: 95px;
  color: ${colors.main_navy};
  text-decoration: none;
`;

const StyledNavItemContainer = styled.div``;

const StyledNavItem = styled(Link)`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.main_black};
  margin-left: 40px;
  text-decoration: none;
`;
const StyledLoginItemContainer = styled.div``;

const StyledLoginItem = styled(Link)`
  font-size: 16px;
  font-weight: 300;
  color: ${colors.main_gray};
  margin-left: 35px;
  text-decoration: none;
`;
const Header = (): JSX.Element => {
  return (
    <>
      <StyledContainer>
        <StyledLogoContainer>
          <StyledLogo to="/">면접왕</StyledLogo>
        </StyledLogoContainer>
        <StyledNavItemContainer>
          <StyledNavItem to="/studylist">스터디</StyledNavItem>
          <StyledNavItem to="/community/communityPage">커뮤니티</StyledNavItem>
          <StyledNavItem to="/userstudy">나의 스터디</StyledNavItem>
        </StyledNavItemContainer>
        <StyledLoginItemContainer>
          <StyledLoginItem href="/login" underline="none">
            로그인
          </StyledLoginItem>
          <StyledLoginItem href="/login/signup" underline="none">
            회원가입
          </StyledLoginItem>
          <StyledLoginItem href="/mypage" underline="none">
            마이페이지
          </StyledLoginItem>
        </StyledLoginItemContainer>
      </StyledContainer>
      <Divider></Divider>
    </>
  );
};

export default Header;
