# FastVisa - Sistema de Métricas

Este módulo implementa un sistema completo para rastrear y almacenar métricas de uso de la aplicación FastVisa.

## 📋 Componentes

### 1. Infraestructura (CloudFormation)
- **Archivo**: `cloudformation/FastVisaCreateMetrics.yaml`
- **Recursos creados**:
  - Tabla DynamoDB `fastVisa_metrics` para almacenar eventos
  - Lambda function `FastVisaRecordMetric` para procesar métricas
  - Endpoint API Gateway `POST /metrics`
  - Políticas IAM necesarias
  - Soporte CORS para peticiones desde el frontend

### 2. Backend (Lambda)
- **Archivo**: `lambda/FastVisaRecordMetric.py`
- **Funcionalidad**: Recibe y almacena eventos de métricas en DynamoDB

### 3. Frontend (JavaScript)
- **Archivo**: `VisaAppointmentConsole/FastVisaMetrics.js`
- **Funcionalidad**: Cliente JavaScript para enviar métricas desde el navegador

### 4. Tests
- **Archivo**: `lambda/test_FastVisaRecordMetric.py`
- **Funcionalidad**: Pruebas unitarias para validar el funcionamiento

## 🚀 Despliegue

### Paso 1: Desplegar infraestructura con CloudFormation

```bash
# Navegar al directorio de CloudFormation
cd cloudformation

# Desplegar el stack
aws cloudformation create-stack \
  --stack-name FastVisaMetrics \
  --template-body file://FastVisaCreateMetrics.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-1
```

### Paso 2: Verificar el despliegue

```bash
# Verificar el estado del stack
aws cloudformation describe-stacks \
  --stack-name FastVisaMetrics \
  --region us-west-1 \
  --query 'Stacks[0].StackStatus'

# Obtener información de los recursos creados
aws cloudformation describe-stack-resources \
  --stack-name FastVisaMetrics \
  --region us-west-1
```

### Paso 3: Probar la Lambda localmente

```bash
cd lambda
python test_FastVisaRecordMetric.py
```

## 📊 Estructura de la Tabla DynamoDB

### Tabla: `fastVisa_metrics`

**Claves:**
- **Partition Key**: `id` (String) - UUID único para cada métrica
- **Sort Key**: `timestamp` (Number) - Timestamp en milisegundos

**Índice Global Secundario:**
- **GSI**: `eventType-timestamp-index`
  - Partition Key: `eventType`
  - Sort Key: `timestamp`

**Atributos:**
```json
{
  "id": "uuid-string",
  "timestamp": 1699999999999,
  "eventType": "page_view",
  "pageUrl": "/",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "sessionId": "session-uuid",
  "userId": "user-uuid",
  "clientIp": "192.168.1.1",
  "metadata": {
    "screenWidth": 1920,
    "screenHeight": 1080,
    "language": "es-MX"
  }
}
```

## 🔌 API Endpoint

### POST /metrics

**URL**: `https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/metrics`

**Request Body:**
```json
{
  "eventType": "page_view",
  "pageUrl": "/",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id",
  "metadata": {
    "screenWidth": 1920,
    "screenHeight": 1080,
    "language": "es-MX"
  }
}
```

**Response:**
```json
{
  "message": "Metric recorded successfully",
  "metricId": "generated-uuid",
  "timestamp": 1699999999999
}
```

## 💻 Integración en el Frontend

### Instalación Básica

1. Incluir el script en tu HTML:
```html
<script src="FastVisaMetrics.js"></script>
```

2. Inicializar en tu aplicación:
```javascript
// Crear instancia del tracker
const metrics = new FastVisaMetrics();

// Habilitar tracking automático de páginas
metrics.initAutoTracking();
```

### Ejemplos de Uso

#### 1. Rastrear visitas a la página principal
```javascript
// El tracking automático ya captura esto, pero puedes hacerlo manualmente:
metrics.trackPageView();
```

#### 2. Rastrear clics en botones
```javascript
document.getElementById('schedule-btn').addEventListener('click', () => {
    metrics.trackButtonClick('schedule-btn', 'Agendar Cita');
});
```

#### 3. Rastrear envíos de formularios
```javascript
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Tu lógica de envío de formulario
        await submitForm();
        
        // Registrar métrica de éxito
        await metrics.trackFormSubmit('contact-form', true);
    } catch (error) {
        // Registrar métrica de fallo
        await metrics.trackFormSubmit('contact-form', false);
    }
});
```

#### 4. Rastrear usuarios autenticados
```javascript
// Cuando el usuario inicia sesión
function onUserLogin(userId) {
    metrics.setUserId(userId);
    metrics.trackCustomEvent('user_login', {
        loginMethod: 'email',
        timestamp: new Date().toISOString()
    });
}

// Cuando el usuario cierra sesión
function onUserLogout() {
    metrics.trackCustomEvent('user_logout');
    metrics.clearUserId();
}
```

#### 5. Eventos personalizados
```javascript
// Rastrear reproducción de video
metrics.trackCustomEvent('video_played', {
    videoId: 'intro-video',
    duration: 120,
    position: 'hero'
});

// Rastrear descarga de documentos
metrics.trackCustomEvent('document_downloaded', {
    documentName: 'visa-requirements.pdf',
    documentType: 'pdf',
    size: 2048
});
```

## 🧪 Tipos de Eventos Comunes

- `page_view` - Vista de página
- `button_click` - Clic en botón
- `form_submit` - Envío de formulario
- `user_login` - Inicio de sesión
- `user_logout` - Cierre de sesión
- `document_downloaded` - Descarga de documento
- `video_played` - Reproducción de video
- `search_performed` - Búsqueda realizada
- `error_encountered` - Error encontrado

## 📈 Consultar Métricas

### Usando AWS CLI

```bash
# Obtener todas las métricas de un tipo específico
aws dynamodb query \
  --table-name fastVisa_metrics \
  --index-name eventType-timestamp-index \
  --key-condition-expression "eventType = :type" \
  --expression-attribute-values '{":type":{"S":"page_view"}}' \
  --region us-west-1

# Escanear métricas recientes
aws dynamodb scan \
  --table-name fastVisa_metrics \
  --limit 10 \
  --region us-west-1
```

### Usando boto3 (Python)

```python
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
table = dynamodb.Table('fastVisa_metrics')

# Consultar por tipo de evento
response = table.query(
    IndexName='eventType-timestamp-index',
    KeyConditionExpression=Key('eventType').eq('page_view')
)

print(f"Total page views: {response['Count']}")
```

## 🔒 Seguridad

- ✅ CORS configurado para permitir peticiones desde el frontend
- ✅ IAM roles con permisos mínimos necesarios
- ✅ Logs de CloudWatch habilitados
- ✅ No se almacenan datos sensibles en las métricas
- ✅ IP del cliente registrada para análisis de tráfico

## 📝 Mejoras Futuras

1. **Dashboard de Analytics**: Crear una interfaz para visualizar métricas
2. **Alertas**: Configurar CloudWatch alarms para patrones inusuales
3. **Retención de datos**: Implementar TTL en DynamoDB para datos antiguos
4. **Agregaciones**: Lambda para procesar métricas y crear reportes diarios
5. **A/B Testing**: Usar métricas para experimentos de usuario
6. **Filtros de privacidad**: Opción para que usuarios desactiven tracking

## 🆘 Troubleshooting

### El endpoint no responde
```bash
# Verificar que el stack esté desplegado
aws cloudformation describe-stacks --stack-name FastVisaMetrics

# Verificar logs de la Lambda
aws logs tail /aws/lambda/FastVisaRecordMetric --follow
```

### CORS errors en el navegador
- Verificar que el endpoint tenga configurado `Access-Control-Allow-Origin: *`
- Asegurarse de que la petición OPTIONS esté funcionando

### Métricas no se guardan
```bash
# Revisar logs de CloudWatch
aws logs filter-log-events \
  --log-group-name /aws/lambda/FastVisaRecordMetric \
  --start-time $(date -u -d '10 minutes ago' +%s)000
```

## 📞 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo de FastVisa.

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
