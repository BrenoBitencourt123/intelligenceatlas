

# Atualizar Conta Admin para Plano Pro

## Situação Atual

Sua conta admin (`brenobitencourt123@gmail.com`) está atualmente no plano **Básico**.

## Ação Necessária

Executar uma migração SQL para atualizar o `plan_type` de `basic` para `pro`:

```sql
UPDATE profiles 
SET plan_type = 'pro', plan_started_at = now()
WHERE email = 'brenobitencourt123@gmail.com';
```

## Resultado

Após a aprovação, sua conta terá:
- Acesso ao plano **Pro**
- Limite de **60 correções/mês** (2/dia)
- Acesso completo ao **Tema do Dia**
- Acesso às **orientações pedagógicas** (contexto, perguntas, estrutura)
- Acesso à **Versão Melhorada**

## Observação Técnica

A alteração será feita via migração de banco de dados, que é a forma segura de modificar dados no ambiente de produção.

