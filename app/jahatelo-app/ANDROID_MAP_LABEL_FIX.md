# Soluciones para el Glitch de Etiquetas en Mapa Android

## Problema Actual
Las etiquetas en Android se renderizan como Views absolutas fuera del MapView. Durante movimiento/zoom:
1. `region` cambia → trigger useEffect
2. 180ms debounce → retraso
3. `pointForCoordinate()` async → más retraso
4. `setPosition()` → re-render
5. Resultado: etiquetas "saltan" (glitch)

## SOLUCIÓN 1: Eliminar Debounce + Usar useRef Transform (RECOMENDADA)

**Ventajas:**
- ✅ Sin re-renders innecesarios
- ✅ Actualizaciones instantáneas
- ✅ Performance óptimo
- ✅ Cambio mínimo al código existente

**Implementación:**

Reemplazar el componente `LabelOverlay` (líneas 46-141) con:

```javascript
const LabelOverlay = React.memo(({ motel, mapRef, visible, region }) => {
  const labelRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const [initialPosition, setInitialPosition] = useState(null);

  // Calcular posición inicial solo una vez
  useEffect(() => {
    if (!visible || !mapRef.current || initialPosition) return;

    const getInitialPosition = async () => {
      try {
        const labelLatitude = motel.latitude + 0.00008;
        const point = await mapRef.current.pointForCoordinate({
          latitude: labelLatitude,
          longitude: motel.longitude,
        });

        if (point && point.x !== undefined && point.y !== undefined) {
          setInitialPosition(point);
          lastPositionRef.current = point;
        }
      } catch (error) {
        console.error('Error getting initial position:', error);
      }
    };

    getInitialPosition();
  }, [motel.latitude, motel.longitude, visible, mapRef, initialPosition]);

  // Actualizar posición usando transform (sin re-render)
  useEffect(() => {
    if (!visible || !mapRef.current || !labelRef.current || !initialPosition) {
      return;
    }

    const updatePosition = async () => {
      try {
        const labelLatitude = motel.latitude + 0.00008;
        const point = await mapRef.current.pointForCoordinate({
          latitude: labelLatitude,
          longitude: motel.longitude,
        });

        if (point && point.x !== undefined && point.y !== undefined) {
          // Usar transform en lugar de cambiar position state
          const deltaX = point.x - lastPositionRef.current.x;
          const deltaY = point.y - lastPositionRef.current.y;

          if (labelRef.current) {
            labelRef.current.setNativeProps({
              style: {
                transform: [
                  { translateX: point.x - initialPosition.x },
                  { translateY: point.y - initialPosition.y }
                ]
              }
            });
          }

          lastPositionRef.current = point;
        }
      } catch (error) {
        // Silenciar errores durante movimiento rápido
      }
    };

    // Usar requestAnimationFrame para sincronizar con frames
    const scheduleUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updatePosition();
      });
    };

    scheduleUpdate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [motel.latitude, motel.longitude, visible, region, mapRef, initialPosition]);

  if (!visible || !initialPosition) {
    return null;
  }

  const isDisabled = motel.plan === 'FREE';

  return (
    <View
      ref={labelRef}
      collapsable={false}
      style={[
        styles.androidLabelOverlay,
        {
          left: initialPosition.x,
          top: initialPosition.y,
        },
      ]}
      pointerEvents="none"
    >
      <View collapsable={false} style={[styles.androidLabelContainer, isDisabled && styles.disabledLabel]}>
        <Text style={styles.androidLabelText} numberOfLines={1}>
          {motel.name}
        </Text>
      </View>
    </View>
  );
});
```

---

## SOLUCIÓN 2: Throttle en lugar de Debounce

**Ventajas:**
- ✅ Actualizaciones más frecuentes durante movimiento
- ✅ Menor lag perceptible
- ✅ Cambio simple

**Implementación:**

```javascript
// En LabelOverlay, reemplazar líneas 95-98 con:
const updatePosition = async () => {
  if (!mapRef.current) return;

  // Throttle: ejecutar inmediatamente si han pasado >50ms desde última actualización
  const now = Date.now();
  const timeSinceLastUpdate = now - (lastUpdateTimeRef.current || 0);

  if (timeSinceLastUpdate < 50) {
    return; // Skip si es muy reciente
  }

  lastUpdateTimeRef.current = now;
  isUpdatingRef.current = true;

  try {
    const labelLatitude = motel.latitude + 0.00008;
    const point = await mapRef.current.pointForCoordinate({
      latitude: labelLatitude,
      longitude: motel.longitude,
    });

    if (point && point.x !== undefined && point.y !== undefined) {
      lastValidPositionRef.current = point;
      setPosition(point);
    }
  } catch (error) {
    // Mantener posición anterior
  } finally {
    isUpdatingRef.current = false;
  }
};

// Llamar directamente sin setTimeout
updatePosition();
```

Agregar al inicio del componente:
```javascript
const lastUpdateTimeRef = useRef(0);
```

---

## SOLUCIÓN 3: Usar React Native Reanimated

**Ventajas:**
- ✅ Animaciones nativas (60 FPS garantizado)
- ✅ No bloquea JS thread
- ✅ Más suave que cualquier solución JS

**Requisitos:**
```bash
npx expo install react-native-reanimated
```

**Implementación:**

```javascript
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const LabelOverlay = React.memo(({ motel, mapRef, visible, region }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [basePosition, setBasePosition] = useState(null);

  useEffect(() => {
    if (!visible || !mapRef.current) return;

    const updatePosition = async () => {
      try {
        const labelLatitude = motel.latitude + 0.00008;
        const point = await mapRef.current.pointForCoordinate({
          latitude: labelLatitude,
          longitude: motel.longitude,
        });

        if (point && point.x !== undefined && point.y !== undefined) {
          if (!basePosition) {
            setBasePosition(point);
          } else {
            // Animar suavemente a nueva posición
            translateX.value = withTiming(point.x - basePosition.x, { duration: 100 });
            translateY.value = withTiming(point.y - basePosition.y, { duration: 100 });
          }
        }
      } catch (error) {
        // Silenciar errores
      }
    };

    // Actualizar cada 16ms (~60 FPS)
    const interval = setInterval(updatePosition, 16);

    return () => clearInterval(interval);
  }, [motel.latitude, motel.longitude, visible, region, mapRef, basePosition]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  if (!visible || !basePosition) {
    return null;
  }

  const isDisabled = motel.plan === 'FREE';

  return (
    <Animated.View
      collapsable={false}
      style={[
        styles.androidLabelOverlay,
        {
          left: basePosition.x,
          top: basePosition.y,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View collapsable={false} style={[styles.androidLabelContainer, isDisabled && styles.disabledLabel]}>
        <Text style={styles.androidLabelText} numberOfLines={1}>
          {motel.name}
        </Text>
      </View>
    </Animated.View>
  );
});
```

---

## SOLUCIÓN 4: Mostrar Etiquetas Solo en Zoom Alto

**Ventajas:**
- ✅ Performance óptimo
- ✅ Menos glitches (menos etiquetas)
- ✅ Experiencia similar a Google Maps

**Implementación:**

Aumentar el threshold de zoom (línea 20):
```javascript
const LABEL_ZOOM_THRESHOLD = 0.1; // Antes: 0.55
```

O agregar un botón toggle para etiquetas:
```javascript
const [userWantsLabels, setUserWantsLabels] = useState(true);

// En el return, agregar botón:
<TouchableOpacity
  style={styles.toggleLabelsButton}
  onPress={() => setUserWantsLabels(!userWantsLabels)}
>
  <Ionicons
    name={userWantsLabels ? "eye" : "eye-off"}
    size={20}
    color={COLORS.white}
  />
  <Text style={styles.toggleLabelsText}>
    {userWantsLabels ? 'Ocultar' : 'Mostrar'} nombres
  </Text>
</TouchableOpacity>

// Y modificar la condición de visibilidad:
visible={showLabels && userWantsLabels}
```

---

## SOLUCIÓN 5: Híbrido - Markers Nativos con Callout Custom

**Ventajas:**
- ✅ Sin glitches (todo nativo)
- ✅ Mejor performance
- ✅ Experiencia más tradicional

**Desventajas:**
- ❌ Requiere tap para ver nombre
- ❌ No muestra todos los nombres simultáneamente

**Implementación:**

```javascript
const CustomMarkerAndroidWithCallout = React.memo(({ motel, onPress }) => {
  const [showCallout, setShowCallout] = useState(false);
  const isDisabled = motel.plan === 'FREE';

  return (
    <Marker
      coordinate={{
        latitude: motel.latitude,
        longitude: motel.longitude,
      }}
      onPress={() => setShowCallout(true)}
      tracksViewChanges={false}
    >
      <View collapsable={false} style={[styles.androidMarkerPin, isDisabled && styles.disabledMarker]}>
        <View collapsable={false} style={styles.markerInner}>
          <Ionicons name="heart" size={14} color={COLORS.white} />
        </View>
      </View>

      {showCallout && (
        <Callout onPress={onPress} tooltip>
          <View style={styles.calloutContainer}>
            <Text style={styles.calloutTitle}>{motel.name}</Text>
            <Text style={styles.calloutSubtitle}>Tap para ver detalles</Text>
          </View>
        </Callout>
      )}
    </Marker>
  );
});

// Agregar a styles:
calloutContainer: {
  backgroundColor: COLORS.primary,
  borderRadius: 12,
  padding: 12,
  minWidth: 120,
  maxWidth: 200,
},
calloutTitle: {
  color: COLORS.white,
  fontWeight: '700',
  fontSize: 13,
},
calloutSubtitle: {
  color: COLORS.white,
  fontSize: 11,
  opacity: 0.9,
  marginTop: 2,
},
```

---

## Recomendación Final

**Para resolver el glitch inmediatamente:** Usar **SOLUCIÓN 1** (useRef + transform)

**Si quieren la mejor experiencia posible:** Combinar **SOLUCIÓN 1** + **SOLUCIÓN 3** (Reanimated)

**Para máximo performance:** Usar **SOLUCIÓN 4** (zoom threshold alto) + **SOLUCIÓN 5** (callouts)

---

## Testing

Después de implementar cualquier solución, probar:

1. ✅ Zoom in/out rápido
2. ✅ Pan rápido en todas direcciones
3. ✅ Zoom + Pan simultáneo
4. ✅ Muchos markers visibles (>20)
5. ✅ Cambio rápido de región con `animateToRegion()`

Si el glitch persiste, es probable que sea un problema de performance del dispositivo.
En ese caso, considerar **SOLUCIÓN 4** (reducir cantidad de etiquetas visibles).
