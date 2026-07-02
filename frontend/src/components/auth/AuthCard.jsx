import AuthLayout from "./AuthLayout";

export default function AuthCard({ title, subtitle, badge, children, footer }) {
  return (
    <AuthLayout title={title} subtitle={subtitle} badge={badge} footer={footer}>
      {children}
    </AuthLayout>
  );
}
