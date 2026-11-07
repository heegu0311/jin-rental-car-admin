import { requireAdmin } from "@/lib/auth";
import { accountIdentity } from "@/lib/account";
import { PageHeading } from "@/components/shared/feedback";
import { AccountSettings } from "@/components/account/AccountSettings";

export default async function MyPage() {
  const { user } = await requireAdmin();
  const hasPassword =
    user.identities?.some((identity) => identity.provider === "email") ?? false;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading
        title="마이페이지"
        description="로그인한 관리자 계정의 프로필과 비밀번호를 관리합니다."
      />
      <AccountSettings
        identity={accountIdentity(user)}
        hasPassword={hasPassword}
      />
    </div>
  );
}
