import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const MyZonesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allZones, setAllZones] = useState([]);
  const [myZones, setMyZones] = useState([]);
  const [expandedZone, setExpandedZone] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [zonesRes, myZonesRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.ZONES_ALL),
        apiService.get(API_ENDPOINTS.MY_ZONES),
      ]);

      if (zonesRes.success) {
        setAllZones(zonesRes.data || []);
      }

      if (myZonesRes.success) {
        setMyZones(myZonesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const isZoneAdded = (zoneId, subZoneId = null) => {
    if (subZoneId) {
      return myZones.some((z) => z.zone_id === zoneId && z.sub_zone_id === subZoneId);
    }
    return myZones.some((z) => z.zone_id === zoneId && !z.sub_zone_id);
  };

  const getMyZone = (zoneId, subZoneId = null) => {
    if (subZoneId) {
      return myZones.find((z) => z.zone_id === zoneId && z.sub_zone_id === subZoneId);
    }
    return myZones.find((z) => z.zone_id === zoneId && !z.sub_zone_id);
  };

  const handleAddZone = async (zone, subZone = null) => {
    const isAdded = isZoneAdded(zone.id, subZone?.id);

    if (isAdded) {
      const myZone = getMyZone(zone.id, subZone?.id);
      if (!myZone) return;

      setSaving(true);
      try {
        await apiService.delete(API_ENDPOINTS.MY_ZONE(myZone.id));
        fetchData();
      } catch (error) {
        Alert.alert(t('common.error'), error.message || t('zones.failedToRemove'));
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        const payload = { zoneId: zone.id };
        if (subZone) {
          payload.subZoneId = subZone.id;
        }

        await apiService.post(API_ENDPOINTS.MY_ZONES, payload);
        fetchData();
      } catch (error) {
        Alert.alert(t('common.error'), error.message || t('zones.failedToAdd'));
      } finally {
        setSaving(false);
      }
    }
  };

  const toggleExpand = (zoneId) => {
    setExpandedZone(expandedZone === zoneId ? null : zoneId);
  };

  const getZoneSelectedCount = (zone) => {
    return myZones.filter((z) => z.zone_id === zone.id).length;
  };

  const areAllSubZonesSelected = (zone) => {
    if (!zone.sub_zones || zone.sub_zones.length === 0) return false;
    return zone.sub_zones.every((subZone) => isZoneAdded(zone.id, subZone.id));
  };

  const handleSelectAllSubZones = async (zone) => {
    if (!zone.sub_zones || zone.sub_zones.length === 0) return;

    const allSelected = areAllSubZonesSelected(zone);
    setSaving(true);

    try {
      if (allSelected) {
        // Deselect all sub-zones
        const zonesToRemove = myZones.filter(
          (z) => z.zone_id === zone.id && z.sub_zone_id
        );
        await Promise.all(zonesToRemove.map((z) => apiService.delete(API_ENDPOINTS.MY_ZONE(z.id))));
      } else {
        // Select all unselected sub-zones using bulk endpoint
        const zonesToAdd = zone.sub_zones
          .filter((subZone) => !isZoneAdded(zone.id, subZone.id))
          .map((subZone) => ({
            zoneId: zone.id,
            subZoneId: subZone.id,
          }));

        if (zonesToAdd.length > 0) {
          await apiService.post(API_ENDPOINTS.MY_ZONES_BULK, { zones: zonesToAdd });
        }
      }
      fetchData();
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('zones.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {t('zones.title')}
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {myZones.length !== 1
                ? t('zones.zonesSelectedPlural', { count: myZones.length })
                : t('zones.zonesSelected', { count: myZones.length })}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* My Zones */}
        {myZones.length > 0 && (
          <View className="px-4 mt-4">
            <Text
              className="text-sm font-medium text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              {t('zones.yourZones')}
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {myZones.map((zone, index) => (
                <View
                  key={zone.id}
                  className={`flex-row items-center p-4 ${
                    index < myZones.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="location" size={20} color={COLORS.success} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {zone.sub_zone_name || zone.zone_name}
                    </Text>
                    {zone.sub_zone_name && (
                      <Text
                        className="text-sm text-gray-500"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {zone.zone_name}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleAddZone(
                        { id: zone.zone_id, name: zone.zone_name },
                        zone.sub_zone_id ? { id: zone.sub_zone_id, name: zone.sub_zone_name } : null
                      )
                    }
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={COLORS.error} />
                    ) : (
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* All Zones */}
        <View className="px-4 mt-4">
          <Text
            className="text-sm font-medium text-gray-500 mb-2"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            {t('zones.availableZones')}
          </Text>

          {allZones.map((zone) => {
            const isExpanded = expandedZone === zone.id;
            const selectedCount = getZoneSelectedCount(zone);
            const hasSubZones = zone.sub_zones && zone.sub_zones.length > 0;

            return (
              <View
                key={zone.id}
                className="bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden"
              >
                <TouchableOpacity
                  className="flex-row items-center p-4"
                  onPress={() => (hasSubZones ? toggleExpand(zone.id) : handleAddZone(zone))}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      selectedCount > 0 ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={selectedCount > 0 ? COLORS.success : COLORS.textSecondary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {zone.name}
                    </Text>
                    {zone.description && (
                      <Text
                        className="text-sm text-gray-500"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {zone.description}
                      </Text>
                    )}
                    {selectedCount > 0 && (
                      <Text
                        className="text-xs text-green-600 mt-1"
                        style={{ fontFamily: 'Poppins-Medium' }}
                      >
                        {t('zones.selected', { count: selectedCount })}
                      </Text>
                    )}
                  </View>
                  {hasSubZones ? (
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  ) : (
                    <TouchableOpacity onPress={() => handleAddZone(zone)} disabled={saving}>
                      <Ionicons
                        name={isZoneAdded(zone.id) ? 'checkmark-circle' : 'add-circle-outline'}
                        size={24}
                        color={isZoneAdded(zone.id) ? COLORS.success : COLORS.primary}
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {isExpanded && hasSubZones && (
                  <View className="border-t border-gray-100">
                    {/* Select All Option */}
                    <TouchableOpacity
                      className="flex-row items-center px-4 py-3 pl-14 border-b border-gray-100 bg-gray-50"
                      onPress={() => handleSelectAllSubZones(zone)}
                      disabled={saving}
                    >
                      <View className="flex-1">
                        <Text
                          className="text-sm text-primary font-medium"
                          style={{ fontFamily: 'Poppins-Medium' }}
                        >
                          {areAllSubZonesSelected(zone) ? t('zones.deselectAll') : t('zones.selectAll')}
                        </Text>
                      </View>
                      <Ionicons
                        name={areAllSubZonesSelected(zone) ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                        size={22}
                        color={areAllSubZonesSelected(zone) ? COLORS.success : COLORS.primary}
                      />
                    </TouchableOpacity>
                    {zone.sub_zones.map((subZone, index) => {
                      const isSubZoneAdded = isZoneAdded(zone.id, subZone.id);
                      return (
                        <TouchableOpacity
                          key={subZone.id}
                          className={`flex-row items-center px-4 py-3 pl-14 ${
                            index < zone.sub_zones.length - 1 ? 'border-b border-gray-50' : ''
                          }`}
                          onPress={() => handleAddZone(zone, subZone)}
                          disabled={saving}
                        >
                          <View className="flex-1">
                            <Text
                              className="text-sm text-gray-700"
                              style={{ fontFamily: 'Poppins-Regular' }}
                            >
                              {subZone.name}
                            </Text>
                          </View>
                          <Ionicons
                            name={isSubZoneAdded ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={isSubZoneAdded ? COLORS.success : COLORS.textSecondary}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyZonesScreen;
