/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers.logic;

import controllers.util.Constants;
import java.util.Calendar;
import models.NdgUser;
import play.libs.Codec;
import play.mvc.Http;
import play.mvc.Http.Response;
import play.mvc.Http.StatusCode;

/**
 *
 * @author wojciech.luczkow
 */
public class DigestUtils {
    public static boolean isAuthorized(Http.Header authorizationHeader, String method)
    {
        boolean retval = false;
        if(authorizationHeader != null) {

            String authorizationString = authorizationHeader.value().replace(',', ' ');
            String username = getParamValue("username", authorizationString);
            NdgUser user = NdgUser.find("byUsername", username).first();
            if(user != null) {
            String receivedDigest = getParamValue("response", authorizationString);
            String serverDigest = generateDigest(user.password,
                                                 getParamValue(" nonce", authorizationString),
                                                 getParamValue(" uri", authorizationString),
                                                 getParamValue(" qop", authorizationString),
                                                 getParamValue(" nc", authorizationString),
                                                 getParamValue(" cnonce", authorizationString),
                                                 method);
            retval = receivedDigest.equals(serverDigest);
            }
        }
        return retval;
    }

    private static String getParamValue(String string, String value) {
        int startIndex = value.indexOf(string) + string.length();
        int endIndex = startIndex;
        boolean quoted = (value.charAt(startIndex + 1) == '"');
        if(quoted) {
            startIndex += 2;
            endIndex = value.indexOf("\"", startIndex);
        } else {
            startIndex += 1;
            endIndex = value.indexOf(" ", startIndex);
        }
        return value.substring( startIndex, endIndex );
    }

    private static String generateDigest(String password, String nonce, String uri, String qop, String nc, String cnonce, String method) {
        StringBuilder combinedH1H2 = new StringBuilder();
        StringBuilder H2 = new StringBuilder(method);
        H2.append(":").append(uri);
        combinedH1H2.append(password).
                     append(":").append(nonce).
                     append(":").append(nc).
                     append(":").append(cnonce).
                     append(":").append(qop).
                     append(":").append(Codec.hexMD5(H2.toString()));
        return Codec.hexMD5(combinedH1H2.toString());
    }

    public static void setDigestResponse(Response response)
    {
        response.setHeader("WWW-Authenticate", DigestUtils.generateDigest());
        response.status = StatusCode.UNAUTHORIZED;
    }

    private static String generateDigest() {
        StringBuilder authHeader = new StringBuilder();
        authHeader.append("Digest realm=\"NDG\", qop=\"auth,auth-int\", nonce=\"");
        authHeader.append(Calendar.getInstance().getTimeInMillis());
        authHeader.append(Constants.SERVER_KEY);
        authHeader.append("\", opaque=\"bmRnb3BhcXVl\" ");
        return authHeader.toString();
    }

}