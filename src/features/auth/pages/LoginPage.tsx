import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/auth.services';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Validation Schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const { t } = useTranslation('auth');
  const setUser = useAuthStore((state) => state.setUser);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/evd-management';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Mục đích: Gọi Supabase Auth, lấy role, cập nhật store rồi redirect
  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { user } = await login(data.email, data.password);
      setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        user_metadata: {
          display_name: user.user_metadata?.display_name as string,
        },
      });
      message.success(t('login_success'));
      navigate(from, { replace: true });
    } catch (error: unknown) {
      console.error(error);
      message.error(t('login_failed'));
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-base leading-none">EV</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Sign in</h2>
        <p className="text-gray-500 text-sm mt-1">
          Access the Enterprise Document Portal
        </p>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} className="space-y-1">
        <Form.Item
          label={<span className="font-medium text-gray-700 text-sm">Email</span>}
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="login-email"
                size="large"
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="you@company.com"
                autoComplete="email"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700 text-sm">Password</span>}
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                id="login-password"
                size="large"
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Your password"
                autoComplete="current-password"
              />
            )}
          />
        </Form.Item>

        <Form.Item className="mb-0 pt-2">
          <Button
            id="login-submit"
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
          >
            Sign in
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
