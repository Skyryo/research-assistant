import { analyzeCompany } from '@/services';
import { Button } from '@/components/ui/button';
import { Fieldset, Input, Stack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { useState } from 'react';

// フォームフィールドの型定義
interface FormField {
  id: string;
  name: string;
  description: string;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  // フォームフィールドの状態管理
  const [fields, setFields] = useState<FormField[]>([
    { id: crypto.randomUUID(), name: '', description: '' },
  ]);

  // フィールドの追加
  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(), // ユニークなIDを生成
        name: '',
        description: '',
      },
    ]);
  };

  // フィールドの削除
  const handleRemoveField = (id: string) => {
    // 少なくとも1つのフィールドは残す
    if (fields.length > 1) {
      setFields(fields.filter((field) => field.id !== id));
    }
  };

  // フィールドの更新
  const handleFieldChange = (id: string, field: 'name' | 'description', value: string) => {
    setFields(fields.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      // フォームデータをAPIに送信する形式に変換
      const formData = {
        companyName: '株式会社A',
        query: 'この企業の情報を教えてください！！',
        additionalContext: {
          fields: fields.reduce(
            (acc, field) => ({
              ...acc,
              [field.name]: field.description,
            }),
            {},
          ),
        },
      };

      const result = await analyzeCompany(
        formData.companyName,
        formData.query,
        formData.additionalContext,
      );
      console.log(result);
    } catch (e) {
      console.error('APIリクエストに失敗しました', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Fieldset.Root size='lg' maxW='md'>
      <Stack spaceY={4}>
        <Stack>
          <Fieldset.Legend>調査アシスタント</Fieldset.Legend>
          <Fieldset.HelperText>項目名と説明を入力してください。</Fieldset.HelperText>
        </Stack>

        <Fieldset.Content>
          {fields.map((field) => (
            <Stack key={field.id} direction='row' spaceX={4} mb={4} alignItems='end'>
              <Field label='項目名'>
                <Input
                  value={field.name}
                  onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                />
              </Field>

              <Field label='説明'>
                <Input
                  value={field.description}
                  onChange={(e) => handleFieldChange(field.id, 'description', e.target.value)}
                />
              </Field>

              <Button onClick={() => handleRemoveField(field.id)} disabled={fields.length === 1}>
                削除
              </Button>
            </Stack>
          ))}
        </Fieldset.Content>

        <Stack direction='row' spaceX={4}>
          <Button onClick={handleAddField} variant='outline'>
            フィールドを追加
          </Button>
          <Button onClick={handleAnalyze} loading={isLoading}>
            分析開始
          </Button>
        </Stack>

        {/* デバッグ用：現在の状態を表示 */}
        <pre className='mt-4 p-4 bg-gray-100 rounded'>{JSON.stringify(fields, null, 2)}</pre>
      </Stack>
    </Fieldset.Root>
  );
}
