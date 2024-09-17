# Below are the steps to enable SSH

## Step 1 - Enable SSH for your deployed name

```bash
cf enable-ssh <your-app-name>
```

## Step 2 - Restage your deployed app after enabled SSH

```bash
cf restage <your-app-name>
```

## Stpe 3 - This command in Cloud Foundry (CF) is used to establish an SSH tunnel between your local machine and a specific app running on Cloud Foundry. This allows you to securely forward ports from your local machine to a remote app in Cloud Foundry

```bash
cf ssh -L 2641:<postgres-host>:<postgress-port> <app-name>
```

### Example

```bash
cf ssh -L 2641:postgres-454cb397-1762-4f6e-8058-f75c85e458f5.cqryblsdrbcs.us-east-1.rds.amazonaws.com:6043 basic-postgres -N
```
