# Guia de Transmisiones en Vivo para Vendedores

**Bienvenido a las transmisiones en vivo de GSHOP!**

Esta guia te ayudara paso a paso a crear tu primera transmision en vivo y vender tus productos mientras interactuas con tus clientes en tiempo real.

---

## Indice

1. [Que necesitas antes de empezar](#que-necesitas-antes-de-empezar)
2. [Crear tu primera transmision](#crear-tu-primera-transmision)
3. [Configurar OBS Studio](#configurar-obs-studio)
4. [Agregar productos a tu transmision](#agregar-productos-a-tu-transmision)
5. [Iniciar la transmision](#iniciar-la-transmision)
6. [Durante la transmision](#durante-la-transmision)
7. [Finalizar la transmision](#finalizar-la-transmision)
8. [Consejos para vender mas](#consejos-para-vender-mas)
9. [Solucion de problemas comunes](#solucion-de-problemas-comunes)

---

## Que necesitas antes de empezar

Antes de hacer tu primera transmision, asegurate de tener:

### Equipo basico

- **Computadora** con conexion a internet estable (minimo 5 Mbps de subida)
- **Camara web** o camara de tu telefono conectada a la computadora
- **Microfono** (puede ser el del computador, pero uno externo se escucha mejor)
- **Buena iluminacion** (luz natural o una lampara frente a ti)

### Software

- **OBS Studio** (programa gratuito para transmitir) - Lo descargaremos en esta guia
- **Navegador web** para acceder al Panel de Vendedor de GSHOP

### En tu tienda GSHOP

- Al menos 1 producto publicado que quieras mostrar
- Tu cuenta de vendedor verificada y activa

---

## Crear tu primera transmision

### Paso 1: Accede al Panel de Vendedor

1. Abre tu navegador y ve a la pagina del Panel de Vendedor
2. Inicia sesion con tu correo y contrasena
3. En el menu de la izquierda, haz clic en **"En Vivo"**

### Paso 2: Crea una nueva transmision

1. Haz clic en el boton azul **"Crear Transmision"**
2. Llena el formulario:

   | Campo | Que poner | Ejemplo |
   |-------|-----------|---------|
   | **Titulo** | Un nombre llamativo para tu transmision | "Ofertas de Viernes! 50% en Ropa" |
   | **Descripcion** | De que se trata tu transmision | "Transmision especial con descuentos exclusivos en toda nuestra coleccion de verano" |
   | **Programar** | (Opcional) Si quieres programarla para despues | Fecha y hora deseada |

3. Selecciona los productos que quieres mostrar (puedes agregar mas despues)
4. Haz clic en **"Crear Transmision"**

Tu transmision esta creada. Ahora vamos a configurar OBS.

---

## Configurar OBS Studio

OBS Studio es un programa gratuito que te permite transmitir video desde tu computadora. Es muy facil de usar una vez configurado.

### Paso 1: Descargar OBS Studio

1. Abre tu navegador
2. Ve a: **https://obsproject.com/**
3. Haz clic en el boton de descarga para tu sistema operativo (Windows, Mac o Linux)
4. Instala el programa siguiendo las instrucciones en pantalla

### Paso 2: Obtener tus datos de transmision

Antes de configurar OBS, necesitas copiar dos datos importantes de GSHOP:

1. En el Panel de Vendedor, ve a **"En Vivo"**
2. Haz clic en tu transmision recien creada
3. Haz clic en el boton **"Configurar OBS"** (aparece en la seccion de configuracion)
4. Veras dos datos importantes:
   - **URL RTMP** (Servidor): algo como `rtmp://stream.gshop.com/live`
   - **Clave de Transmision**: un codigo largo de letras y numeros

**IMPORTANTE:** La Clave de Transmision es privada. No la compartas con nadie.

### Paso 3: Configurar OBS

1. Abre OBS Studio
2. Ve a **Configuracion** (boton abajo a la derecha)
3. En el menu izquierdo, haz clic en **"Transmision"**
4. Configura estos campos:

   | Campo | Que poner |
   |-------|-----------|
   | **Servicio** | Selecciona "Personalizado..." |
   | **Servidor** | Pega la URL RTMP que copiaste de GSHOP |
   | **Clave de transmision** | Pega la Clave de Transmision de GSHOP |

5. Haz clic en **"Aplicar"**

### Paso 4: Configurar calidad de video (Recomendado)

Para que tu transmision se vea bien:

1. En OBS, ve a **Configuracion** > **Salida**
2. Configura estos valores:

   | Campo | Valor recomendado |
   |-------|-------------------|
   | **Bitrate de Video** | 2500 - 4500 kbps (segun tu internet) |
   | **Codificador** | x264 (o Hardware si tu computadora lo soporta) |
   | **Intervalo de Fotogramas** | 2 |

3. Ve a **Configuracion** > **Video**
4. Configura:

   | Campo | Valor recomendado |
   |-------|-------------------|
   | **Resolucion de Salida** | 1280x720 (HD) o 1920x1080 (Full HD) |
   | **FPS** | 30 |

5. Haz clic en **"Aplicar"** y luego **"Aceptar"**

### Paso 5: Agregar tu camara y microfono

1. En la pantalla principal de OBS, busca el panel de **"Fuentes"** (abajo)
2. Haz clic en el boton **"+"**
3. Selecciona **"Dispositivo de Captura de Video"**
4. Dale un nombre (ejemplo: "Mi Camara") y haz clic en OK
5. Selecciona tu camara en la lista y haz clic en OK
6. Repite para agregar tu microfono: **"+"** > **"Captura de Entrada de Audio"**

Ahora deberias ver tu imagen en la pantalla de OBS.

---

## Agregar productos a tu transmision

Puedes agregar productos antes o durante la transmision:

### Desde el Panel de Vendedor

1. Abre tu transmision en el Panel de Vendedor
2. En la seccion **"Productos de la Transmision"**, haz clic en **"Agregar Producto"**
3. Selecciona el producto de tu catalogo
4. (Opcional) Puedes agregar un **precio especial** solo para la transmision
5. Haz clic en **"Agregar"**

### Destacar un producto durante la transmision

Cuando estes en vivo y quieras mostrar un producto en pantalla:

1. Busca el producto en la lista
2. Haz clic en el boton **"Mostrar"** (icono de ojo)
3. El producto aparecera destacado para tus espectadores
4. Para quitarlo, haz clic en **"Ocultar"**

---

## Iniciar la transmision

**MUY IMPORTANTE:** Debes seguir este orden exacto:

### 1. Primero: Inicia la transmision en OBS

1. En OBS, asegurate de que todo se ve bien en la vista previa
2. Haz clic en el boton **"Iniciar Transmision"** (abajo a la derecha)
3. Espera unos segundos hasta que OBS muestre que esta transmitiendo

### 2. Segundo: Activa la transmision en GSHOP

1. En el Panel de Vendedor, abre tu transmision
2. Haz clic en el boton verde **"Transmitir"** o **"Ir en Vivo"**
3. Tu transmision ahora esta visible para tus clientes!

---

## Durante la transmision

### Panel de control en vivo

Mientras transmites, veras en tiempo real:

- **Espectadores actuales**: Cuantas personas te estan viendo
- **Pico de espectadores**: El maximo de personas que tuviste
- **Ventas totales**: Cuanto has vendido durante la transmision
- **Chat**: Mensajes de tus espectadores

### Moderacion del chat

Puedes moderar los comentarios de tus espectadores:

- **Eliminar mensaje**: Borra un mensaje inapropiado
- **Timeout**: Silencia a un usuario por 5 minutos
- **Banear**: Bloquea permanentemente a un usuario del chat

### Destacar productos

Durante la transmision, destaca los productos que estes mostrando:

1. Encuentra el producto en la lista
2. Haz clic en **"Mostrar"** para destacarlo
3. Los espectadores lo veran resaltado y podran comprarlo facilmente

---

## Finalizar la transmision

Cuando termines de transmitir:

### 1. Termina en GSHOP

1. En el Panel de Vendedor, haz clic en el boton rojo **"Finalizar Transmision"**
2. Confirma que quieres terminar

### 2. Termina en OBS

1. En OBS, haz clic en **"Detener Transmision"**
2. Puedes cerrar OBS

### Revisa tus resultados

Despues de terminar, podras ver:

- Total de espectadores que tuviste
- Pico maximo de espectadores
- Ventas realizadas durante la transmision
- Productos mas vendidos

---

## Consejos para vender mas

### Antes de la transmision

1. **Anuncia tu transmision** en redes sociales con anticipacion
2. **Prepara tus productos** para mostrarlos facilmente
3. **Prueba tu equipo** (camara, microfono, internet) antes de empezar
4. **Escoge un buen horario** cuando tus clientes esten disponibles

### Durante la transmision

1. **Saluda a quienes llegan** y menciona sus nombres
2. **Muestra los productos de cerca** y describe sus detalles
3. **Responde preguntas** del chat rapidamente
4. **Ofrece descuentos exclusivos** solo para la transmision
5. **Crea urgencia**: "Solo quedan 3 unidades!"
6. **Agradece las compras** en vivo

### Despues de la transmision

1. **Agradece a tu audiencia** en redes sociales
2. **Revisa las estadisticas** para mejorar la proxima vez
3. **Programa tu siguiente transmision** y anunciala

---

## Solucion de problemas comunes

### "No se ve mi video en OBS"

- Verifica que tu camara este conectada
- En **Fuentes**, haz doble clic en tu camara y selecciona el dispositivo correcto
- Asegurate de que otra aplicacion no este usando la camara

### "OBS dice que no puede conectar"

- Verifica que la URL RTMP y la Clave de Transmision esten correctas
- Revisa tu conexion a internet
- Asegurate de que no tengas un firewall bloqueando OBS

### "Mi transmision se ve cortada o con lag"

- Reduce el Bitrate de Video en **Configuracion** > **Salida** (intenta 2000 kbps)
- Cierra otras aplicaciones que usen internet
- Usa cable de red en lugar de WiFi si es posible

### "Los espectadores dicen que no hay sonido"

- En OBS, verifica que el medidor de audio se mueva cuando hablas
- Revisa que tu microfono este seleccionado correctamente
- Asegurate de que el microfono no este silenciado

### "No puedo iniciar la transmision en GSHOP"

- Asegurate de que la transmision este en estado "Programado" o "Scheduled"
- Primero inicia en OBS, luego en GSHOP
- Refresca la pagina del Panel de Vendedor

---

## Necesitas ayuda?

Si tienes problemas o dudas:

1. Revisa esta guia nuevamente
2. Contacta a soporte de GSHOP desde tu Panel de Vendedor
3. Consulta nuestra seccion de preguntas frecuentes

---

**Mucho exito con tus transmisiones!** Las ventas en vivo son una forma increible de conectar con tus clientes y mostrar tus productos. Con practica, te volveras un experto.
