### Обновления схем по hasura

#### Ручное обновления

1. Разверните сервис hasura для stage или production, как сервис подниматься у него не будет схем для GraphQL. Схему нужно экспортировать с dev, так как схемы они везде одинаковые.

```sh
curl -d'{"type": "export_metadata", "args": {}}' <dev host>/v1/metadata -o hasura_metadata.json -H 'X-Hasura-Admin-Secret: <key>'
```

2. Схему которую мы ранее импортировали мы устанавливаем на hasura для stage или production:

```sh
curl -d'{"type":"replace_metadata", "args":'$(cat hasura_metadata.json)'}' <stage or production url>/metadata 'X-Hasura-Admin-Secret: <key>'
```

#### Через репозиторий

Схемы можно взять отсюда: [hasura](https://github.com/UniqueNetwork/unique-explorer-api/tree/develop/hasura)

и установить их так: 
```sh
curl -d'{"type":"replace_metadata", "args":'$(cat hasura_metadata.json)'}' <stage or production url>/metadata 'X-Hasura-Admin-Secret: <key>'
```

####  Через скрипты

##### Получение схемы через скрипты
```sh
./export.sh -d https://dev -k seckert_key
```

##### Обновление схемы

```sh
./import.sh -d https://prod -k seckert_key
```