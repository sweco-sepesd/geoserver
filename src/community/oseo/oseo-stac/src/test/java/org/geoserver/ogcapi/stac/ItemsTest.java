/* (c) 2021 Open Source Geospatial Foundation - all rights reserved
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package org.geoserver.ogcapi.stac;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.junit.Assert.assertEquals;

import com.jayway.jsonpath.DocumentContext;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;
import java.util.stream.Collectors;
import net.minidev.json.JSONArray;
import org.hamcrest.Matchers;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

public class ItemsTest extends STACTestSupport {

    private static final double EPS = 1e-5;

    static TimeZone currentTimeZone;

    @BeforeClass
    public static void setupGMT() {
        currentTimeZone = TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("GMT"));
    }

    @AfterClass
    public static void resetTimeZone() {
        TimeZone.setDefault(currentTimeZone);
    }

    @Test
    public void testSentinelItemsJSON() throws Exception {
        DocumentContext json = getAsJSONPath("ogc/stac/collections/SENTINEL2/items", 200);

        assertEquals("FeatureCollection", json.read("type"));

        // check it's only sentinel2 data
        List<String> collections = json.read("features[*].collection");
        assertThat(new HashSet<>(collections), containsInAnyOrder("SENTINEL2"));
        assertEquals(Integer.valueOf(19), json.read("features.length()", Integer.class));

        // read single reference feature
        DocumentContext s2Sample =
                readSingleContext(
                        json,
                        "features[?(@.id == 'S2A_OPER_MSI_L1C_TL_MTI__20170308T220244_A008933_T11SLT_N02"
                                + ".04')]");
        checkSentinel2Sample(s2Sample);

        // a sample image that does have an actual time range
        DocumentContext s2Range =
                readSingleContext(
                        json,
                        "features[?(@.id == 'S2A_OPER_MSI_L1C_TL_SGS__20170226T171842_A008785_T32TPN_N02.04')]");
        assertEquals("2017-02-26T10:20:21.026+00:00", s2Range.read("properties.start_datetime"));
        assertEquals("2017-02-26T10:30:00.031+00:00", s2Range.read("properties.end_datetime"));
    }

    @Test
    public void testSentinelItemJSON() throws Exception {
        DocumentContext json =
                getAsJSONPath(
                        "ogc/stac/collections/SENTINEL2/items/S2A_OPER_MSI_L1C_TL_MTI__20170308T220244_A008933_T11SLT_N02.04",
                        200);

        assertEquals("Feature", json.read("type"));
        checkSentinel2Sample(json);
    }

    private void checkSentinel2Sample(DocumentContext s2Sample) {
        // ... geometry
        assertEquals("Polygon", s2Sample.read("geometry.type"));
        JSONArray coordinates = s2Sample.read("geometry.coordinates");
        JSONArray shell = (JSONArray) coordinates.get(0);
        assertPoint(-117.9694, 33.3476, (JSONArray) shell.get(0));
        assertPoint(-117.9806, 34.3377, (JSONArray) shell.get(1));
        assertPoint(-119.1738, 34.3224, (JSONArray) shell.get(2));
        assertPoint(-119.1489, 33.3328, (JSONArray) shell.get(3));
        assertPoint(-117.9694, 33.3476, (JSONArray) shell.get(4));
        // ... bbox
        assertEquals(-119.17378, s2Sample.read("bbox[0]", Double.class), EPS);
        assertEquals(33.332767, s2Sample.read("bbox[1]", Double.class), EPS);
        assertEquals(-117.969376, s2Sample.read("bbox[2]", Double.class), EPS);
        assertEquals(34.337738, s2Sample.read("bbox[3]", Double.class), EPS);
        // ... time range (single value)
        assertEquals("2017-03-08T18:54:21.026+00:00", s2Sample.read("properties.datetime"));
        // ... instrument related
        assertEquals("sentinel-2a", s2Sample.read("properties.platform"));
        assertEquals("sentinel2", s2Sample.read("properties.constellation"));
        List<String> instruments = s2Sample.read("properties.instruments");
        assertThat(instruments, Matchers.containsInAnyOrder("msi"));
        // ... eo
        assertEquals(Integer.valueOf(7), s2Sample.read("properties.eo:cloud_cover", Integer.class));
        // ... links
        assertEquals(
                "http://localhost:8080/geoserver/ogcapi/stac/collections/SENTINEL2",
                readSingle(s2Sample, "links[?(@.rel == 'collection')].href"));
        assertEquals(
                "application/json", readSingle(s2Sample, "links[?(@.rel == 'collection')].type"));
        assertEquals(
                "http://localhost:8080/geoserver/ogcapi/stac",
                readSingle(s2Sample, "links[?(@.rel == 'root')].href"));
        assertEquals("application/json", readSingle(s2Sample, "links[?(@.rel == 'root')].type"));
        assertEquals(
                "http://localhost:8080/geoserver/ogcapi/stac/collections/SENTINEL2/items/S2A_OPER_MSI_L1C_TL_MTI__20170308T220244_A008933_T11SLT_N02.04",
                readSingle(s2Sample, "links[?(@.rel == 'self')].href"));
        assertEquals(
                "application/geo+json", readSingle(s2Sample, "links[?(@.rel == 'self')].type"));
    }

    @Test
    public void testLandsat8ItemsJSON() throws Exception {
        DocumentContext json = getAsJSONPath("ogc/stac/collections/LANDSAT8/items", 200);

        assertEquals("FeatureCollection", json.read("type"));

        // check it's only sentinel2 data
        List<String> collections = json.read("features[*].collection");
        assertThat(new HashSet<>(collections), containsInAnyOrder("LANDSAT8"));
        assertEquals(Integer.valueOf(1), json.read("features.length()", Integer.class));

        // read single reference feature, will test only peculiarities of this
        DocumentContext l8Sample = readSingleContext(json, "features[?(@.id == 'LS8_TEST.02')]");
        // ... instrument related
        assertEquals("LANDSAT_8", l8Sample.read("properties.platform"));
        List<String> instruments = l8Sample.read("properties.instruments");
        assertThat(instruments, Matchers.containsInAnyOrder("oli", "tirs"));
        assertEquals("landsat8", l8Sample.read("properties.constellation"));
        // creation and modification
        assertEquals("2017-02-26T10:24:58.000+00:00", l8Sample.read("properties.created"));
        assertEquals("2017-02-28T10:24:58.000+00:00", l8Sample.read("properties.updated"));
    }

    private void assertPoint(double x, double y, JSONArray coordinate) {
        assertEquals(x, (Double) coordinate.get(0), EPS);
        assertEquals(y, (Double) coordinate.get(1), EPS);
    }

    @Test
    public void testSentinelItemsHTML() throws Exception {
        Document doc = getAsJSoup("ogc/stac/collections/SENTINEL2/items?f=html");
        assertEquals("SENTINEL2 items", doc.select("#title").text());

        // the item identifiers
        Set<String> titles =
                doc.select("div.card-header h2")
                        .stream()
                        .map(e -> e.text())
                        .collect(Collectors.toSet());
        assertThat(titles, Matchers.everyItem(Matchers.startsWith("S2A_OPER_MSI")));

        // test the Sentinel2 entry
        Elements s2Body =
                doc.select(
                        "div.card-header:has(a:contains(S2A_OPER_MSI_L1C_TL_MTI__20170308T220244_A008933_T11SLT_N02.04)) ~ div.card-body");
        testSentinel2SampleHTML(s2Body);
    }

    private void testSentinel2SampleHTML(Elements elements) {
        assertTextContains(elements, "[data-tid='gbounds']", "-119,174, 33,333, -117,969, 34,338.");
        assertTextContains(elements, "[data-tid='ccover']", "7");
    }
}
